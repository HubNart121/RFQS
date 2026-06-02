'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import {
  db,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from '@/lib/firebase/firestore'
import { logAction } from '@/lib/hooks/useAuditLog'
import { RFQ, Product, Supplier, Logistics, SupplierOffer, RFQItem, RFQStatus } from '@/lib/types'
import styles from './rfqs.module.css'

function formatDeadlineDate(deadline: any): string {
  if (!deadline) return '-'
  if (deadline && typeof deadline === 'object' && 'seconds' in deadline) {
    return new Date(deadline.seconds * 1000).toLocaleDateString('th-TH')
  }
  return new Date(deadline).toLocaleDateString('th-TH')
}

export default function RFQsPage() {
  const router = useRouter()
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [logistics, setLogistics] = useState<Logistics[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modals & Panels State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null)

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDeadline, setEditDeadline] = useState('')

  // Create RFQ Form State
  const [title, setTitle] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Add Quote Offer Form State
  const [offerSupplierId, setOfferSupplierId] = useState('')
  const [offerLeadTime, setOfferLeadTime] = useState('')
  const [offerLogisticsId, setOfferLogisticsId] = useState('')
  const [offerLogisticsCost, setOfferLogisticsCost] = useState('')
  const [offerPrices, setOfferPrices] = useState<Record<string, string>>({})
  const [offerNotes, setOfferNotes] = useState('')
  const [offerSubmitting, setOfferSubmitting] = useState(false)

  // Real-time Fetch from Firestore
  useEffect(() => {
    // 1. Fetch RFQs
    const rfqQuery = query(collection(db, 'rfqs'), orderBy('createdAt', 'desc'))
    const unsubscribeRFQs = onSnapshot(rfqQuery, (snapshot) => {
      const data: RFQ[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as RFQ)
      })
      setRfqs(data)
      setLoading(false)
    }, (error) => {
      console.error('[RFQs] Fetch error:', error)
      setLoading(false)
    })

    // 2. Fetch Products
    const unsubscribeProducts = onSnapshot(query(collection(db, 'products')), (snapshot) => {
      const data: Product[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product)
      })
      setProducts(data)
    })

    // 3. Fetch Suppliers
    const unsubscribeSuppliers = onSnapshot(query(collection(db, 'suppliers')), (snapshot) => {
      const data: Supplier[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Supplier)
      })
      setSuppliers(data)
    })

    // 4. Fetch Logistics
    const unsubscribeLogistics = onSnapshot(query(collection(db, 'logistics')), (snapshot) => {
      const data: Logistics[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Logistics)
      })
      setLogistics(data)
    })

    return () => {
      unsubscribeRFQs()
      unsubscribeProducts()
      unsubscribeSuppliers()
      unsubscribeLogistics()
    }
  }, [])

  // Auto-generate RFQ Document Number
  async function generateRFQNumber(): Promise<string> {
    const snap = await getDocs(collection(db, 'rfqs'))
    const count = snap.size + 1
    const year = new Date().getFullYear()
    const padded = String(count).padStart(4, '0')
    return `RFQ-${year}-${padded}`
  }

  // Create RFQ
  async function handleCreateRFQ(e: FormEvent) {
    e.preventDefault()
    if (!title || selectedProductIds.length === 0 || selectedSupplierIds.length === 0 || !deadline) {
      alert('กรุณากรอกข้อมูลและเลือกรายการสินค้า/คู่ค้าให้ครบถ้วน')
      return
    }

    setSubmitting(true)
    try {
      const rfqNumber = await generateRFQNumber()
      
      // Map items
      const items: RFQItem[] = selectedProductIds.map(pid => {
        const prod = products.find(p => p.id === pid)!
        return {
          productId: pid,
          productName: prod.name,
          quantity: productQuantities[pid] || 1,
          unit: prod.unit || 'ชิ้น',
          imageUrl: prod.imageUrl || ''
        }
      })

      const newRFQ = {
        rfqNumber,
        status: 'issued' as RFQStatus,
        title,
        createdBy: 'Administrator',
        items,
        targetSupplierIds: selectedSupplierIds,
        supplierOffers: [],
        selectedOfferId: null,
        dates: {
          issued: serverTimestamp(),
          deadline: new Date(deadline),
          converted: null
        },
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'rfqs'), newRFQ)

      await logAction({
        action: 'CREATE_RFQ',
        targetId: docRef.id,
        targetType: 'rfq',
        details: `สร้างใบขอราคาใหม่: ${rfqNumber} (${title})`
      })

      // Reset
      setTitle('')
      setSelectedProductIds([])
      setProductQuantities({})
      setSelectedSupplierIds([])
      setDeadline('')
      setIsCreateOpen(false)
    } catch (err) {
      console.error('[RFQs] Create RFQ error:', err)
      alert('เกิดข้อผิดพลาดในการสร้างใบขอราคา')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Product Selection Toggle
  function toggleProduct(pid: string) {
    setSelectedProductIds(prev => {
      if (prev.includes(pid)) {
        const next = prev.filter(id => id !== pid)
        const nextQty = { ...productQuantities }
        delete nextQty[pid]
        setProductQuantities(nextQty)
        return next
      } else {
        setProductQuantities(q => ({ ...q, [pid]: 1 }))
        return [...prev, pid]
      }
    })
  }

  // Add Quote Offer
  async function handleAddOffer(e: FormEvent) {
    e.preventDefault()
    if (!selectedRFQ || !offerSupplierId || !offerLogisticsId) return

    setOfferSubmitting(true)
    try {
      const chosenSupplier = suppliers.find(s => s.id === offerSupplierId)!
      const chosenLogistics = logistics.find(l => l.id === offerLogisticsId)!
      
      const prices = selectedRFQ.items.map(item => ({
        productId: item.productId,
        unitPrice: Number(offerPrices[item.productId]) || 0
      }))

      const itemsTotal = selectedRFQ.items.reduce((sum, item) => {
        const uPrice = Number(offerPrices[item.productId]) || 0
        return sum + (uPrice * item.quantity)
      }, 0)

      const logisticsCost = Number(offerLogisticsCost) || 0
      const totalAmount = itemsTotal + logisticsCost

      const newOffer: SupplierOffer = {
        id: Math.random().toString(36).substring(7),
        supplierId: offerSupplierId,
        supplierName: chosenSupplier.name,
        leadTimeDays: Number(offerLeadTime) || 3,
        logisticsId: offerLogisticsId,
        logisticsCost,
        prices,
        totalAmount,
        submittedAt: serverTimestamp() as any,
        notes: offerNotes
      }

      // Add to array & Update RFQ Status to 'quotes_received'
      const updatedOffers = [...(selectedRFQ.supplierOffers || []), newOffer]
      const rfqRef = doc(db, 'rfqs', selectedRFQ.id)
      
      await updateDoc(rfqRef, {
        supplierOffers: updatedOffers,
        status: 'quotes_received'
      })

      await logAction({
        action: 'ADD_QUOTE_OFFER',
        targetId: selectedRFQ.id,
        targetType: 'rfq',
        details: `เพิ่มเสนอราคาจาก ${chosenSupplier.name} สำหรับ ${selectedRFQ.rfqNumber}`
      })

      // Reset offer form
      setOfferSupplierId('')
      setOfferLeadTime('')
      setOfferLogisticsId('')
      setOfferLogisticsCost('')
      setOfferPrices({})
      setOfferNotes('')
      
      // Update selected RFQ in UI state
      setSelectedRFQ(prev => prev ? { ...prev, supplierOffers: updatedOffers, status: 'quotes_received' } : null)
    } catch (err) {
      console.error('[RFQs] Add offer error:', err)
      alert('เกิดข้อผิดพลาดในการบันทึกเสนอราคา')
    } finally {
      setOfferSubmitting(false)
    }
  }

  // Convert RFQ to PO
  async function handleConvertToPO(offer: SupplierOffer) {
    if (!selectedRFQ) return
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะอนุมัติข้อเสนอราคาของ "${offer.supplierName}" และออกใบสั่งซื้อ (PO)?`)) return

    try {
      // 1. Generate PO Number
      const poSnap = await getDocs(collection(db, 'purchase_orders'))
      const poCount = poSnap.size + 1
      const year = new Date().getFullYear()
      const poNumber = `PO-${year}-${String(poCount).padStart(4, '0')}`

      // 2. Map items with prices
      const poItems = selectedRFQ.items.map(item => {
        const uPrice = offer.prices.find(p => p.productId === item.productId)?.unitPrice || 0
        return {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: uPrice,
          totalPrice: uPrice * item.quantity,
          imageUrl: item.imageUrl
        }
      })

      const subtotal = poItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const chosenLogistics = logistics.find(l => l.id === offer.logisticsId)

      const newPO = {
        poNumber,
        rfqId: selectedRFQ.id,
        status: 'draft',
        supplierId: offer.supplierId,
        supplierName: offer.supplierName,
        logisticsId: offer.logisticsId,
        logisticsName: chosenLogistics?.name || 'ไม่มีบริการจัดส่ง',
        trackingNumber: '',
        items: poItems,
        subtotal,
        logisticsCost: offer.logisticsCost,
        totalAmount: offer.totalAmount,
        paymentTerms: suppliers.find(s => s.id === offer.supplierId)?.paymentTerms || 'Net 30',
        notes: offer.notes,
        createdBy: 'Administrator',
        dates: {
          poIssued: serverTimestamp(),
          deliveryDue: new Date(Date.now() + (offer.leadTimeDays * 24 * 60 * 60 * 1000)),
          shipmentDate: null,
          expectedDelivery: null,
          actualDelivery: null,
          closed: null
        },
        statusHistory: [
          {
            status: 'draft',
            changedBy: 'Administrator',
            changedByEmail: 'admin@company.com',
            changedAt: serverTimestamp(),
            note: `ระบบสร้างใบสั่งซื้อแบบร่างจากการอนุมัติใบขอราคา ${selectedRFQ.rfqNumber}`
          }
        ],
        createdAt: serverTimestamp()
      }

      const poRef = await addDoc(collection(db, 'purchase_orders'), newPO)

      // 3. Update RFQ Status to 'converted_to_po'
      await updateDoc(doc(db, 'rfqs', selectedRFQ.id), {
        status: 'converted_to_po',
        selectedOfferId: offer.id,
        'dates.converted': serverTimestamp()
      })

      await logAction({
        action: 'CONVERT_RFQ_TO_PO',
        targetId: selectedRFQ.id,
        targetType: 'rfq',
        details: `อนุมัติข้อเสนอราคาและเปิดใบสั่งซื้อ ${poNumber} จากใบขอราคา ${selectedRFQ.rfqNumber}`
      })

      alert(`แปลงใบสั่งซื้อสำเร็จ! ออกเอกสารเลขที่ ${poNumber} เรียบร้อยแล้ว`)
      setSelectedRFQ(null)
      router.push('/purchase-orders')
    } catch (err) {
      console.error('[RFQs] Convert to PO error:', err)
      alert('เกิดข้อผิดพลาดในการอนุมัติใบสั่งซื้อ')
    }
  }

  // Update RFQ
  async function handleUpdateRFQ() {
    if (!selectedRFQ || !editTitle || !editDeadline) return
    try {
      const rfqRef = doc(db, 'rfqs', selectedRFQ.id)
      const updatedDeadline = new Date(editDeadline)
      
      await updateDoc(rfqRef, {
        title: editTitle,
        'dates.deadline': updatedDeadline
      })
      
      await logAction({
        action: 'UPDATE_RFQ_STATUS',
        targetId: selectedRFQ.id,
        targetType: 'rfq',
        details: `แก้ไขข้อมูลใบขอราคา: ${selectedRFQ.rfqNumber} -> หัวข้อ: ${editTitle}`
      })
      
      setSelectedRFQ(prev => prev ? { 
        ...prev, 
        title: editTitle, 
        dates: { ...prev.dates, deadline: updatedDeadline as any } 
      } : null)
      
      setIsEditing(false)
    } catch (err) {
      console.error('[RFQs] Update error:', err)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  // Delete RFQ
  async function handleDeleteRFQ(id: string, rfqNo: string) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบใบขอราคา "${rfqNo}"?`)) return
    try {
      await deleteDoc(doc(db, 'rfqs', id))
      setSelectedRFQ(null)
    } catch (err) {
      alert('เกิดข้อผิดพลาด')
    }
  }

  return (
    <>
      <Topbar title="ใบขอราคา (RFQ)" />

      <section className={styles.container}>
        {/* Header section */}
        <div className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <h1>ใบขอราคา (Request for Quotations)</h1>
            <p>เปิดใบขอราคาสินค้าไปยังคู่ค้า เปรียบเทียบใบเสนอราคา และอนุมัติเปิดใบสั่งซื้อ (PO)</p>
          </div>
          <button onClick={() => setIsCreateOpen(true)} className={styles.createBtn}>
            <span>+</span> สร้างใบขอราคาใหม่
          </button>
        </div>

        {/* Loading / Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="animate-spin" style={{ fontSize: '32px' }}>🔄</span>
          </div>
        ) : rfqs.length > 0 ? (
          <div className={styles.grid}>
            {rfqs.map(rfq => (
              <article key={rfq.id} className={styles.card} onClick={() => setSelectedRFQ(rfq)}>
                <div className={styles.cardHeader}>
                  <span className={styles.rfqNumber}>{rfq.rfqNumber}</span>
                  <span className={`${styles.statusBadge} ${styles['status-' + rfq.status]}`}>
                    {rfq.status === 'issued' && 'เปิดขอราคา'}
                    {rfq.status === 'quotes_received' && 'ได้รับข้อเสนอ'}
                    {rfq.status === 'compared' && 'เปรียบเทียบแล้ว'}
                    {rfq.status === 'converted_to_po' && 'เปิด PO แล้ว'}
                    {rfq.status === 'cancelled' && 'ยกเลิก'}
                  </span>
                </div>

                <h3 className={styles.rfqTitle}>{rfq.title}</h3>

                <div className={styles.cardBody}>
                  <div style={{ marginBottom: '8px' }}>📦 สินค้า: {rfq.items?.length} รายการ</div>
                  <div>🏭 ส่งถึงคู่ค้า: {rfq.targetSupplierIds?.length} บริษัท</div>
                </div>

                <div className={styles.cardFooter}>
                  <span>สร้างโดย: {rfq.createdBy}</span>
                  <span className={styles.deadline}>
                    เดดไลน์: {formatDeadlineDate(rfq.dates?.deadline)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>ยังไม่มีใบขอราคาในระบบ</h3>
            <p>กดปุ่ม "สร้างใบขอราคาใหม่" ด้านบนเพื่อเริ่มต้นกระบวนการจัดซื้อจัดจ้าง</p>
          </div>
        )}

        {/* 1. Create RFQ Drawer */}
        {isCreateOpen && (
          <>
            <div className={styles.overlay} onClick={() => setIsCreateOpen(false)} />
            <div className={styles.drawer} role="dialog" aria-modal="true">
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>สร้างใบขอราคาใหม่</h2>
                <button onClick={() => setIsCreateOpen(false)} className={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleCreateRFQ} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>หัวข้อขอราคา *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={styles.input}
                    placeholder="ขอราคาเหล็กเส้นสำหรับโครงการขยายโรงงาน"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>เลือกรายการสินค้าและระบุจำนวน *</label>
                  <div className={styles.selectorList}>
                    {products.map(prod => {
                      const isChecked = selectedProductIds.includes(prod.id)
                      return (
                        <label key={prod.id} className={styles.selectorItem}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProduct(prod.id)}
                          />
                          <span>{prod.name} ({prod.sku})</span>
                          {isChecked && (
                            <input
                              type="number"
                              min={1}
                              value={productQuantities[prod.id] || 1}
                              onChange={e => setProductQuantities({
                                ...productQuantities,
                                [prod.id]: Number(e.target.value) || 1
                              })}
                              className={styles.quantityInput}
                              placeholder="จำนวน"
                            />
                          )}
                        </label>
                      )
                    })}
                    {products.length === 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--color-red)' }}>
                        ⚠️ ไม่มีสินค้าในคลัง กรุณาไปเพิ่มสินค้าก่อน
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>เลือกคู่ค้าที่จะส่งใบขอราคา *</label>
                  <div className={styles.selectorList}>
                    {suppliers.map(sup => (
                      <label key={sup.id} className={styles.selectorItem}>
                        <input
                          type="checkbox"
                          checked={selectedSupplierIds.includes(sup.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedSupplierIds([...selectedSupplierIds, sup.id])
                            } else {
                              setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== sup.id))
                            }
                          }}
                        />
                        <span>{sup.name} (⭐️ {sup.rating || 5}.0)</span>
                      </label>
                    ))}
                    {suppliers.length === 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--color-red)' }}>
                        ⚠️ ไม่มีคู่ค้าลงทะเบียน กรุณาไปเพิ่มคู่ค้าก่อน
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>วันสิ้นสุดการรับข้อเสนอ (Deadline) *</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || selectedProductIds.length === 0 || selectedSupplierIds.length === 0}
                  className={styles.submitBtn}
                >
                  {submitting ? 'กำลังสร้างเอกสาร...' : 'บันทึกเปิดใบขอราคา'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* 2. Detailed View & Price Compare Matrix Modal */}
        {selectedRFQ && (
          <>
            <div className={styles.overlay} onClick={() => setSelectedRFQ(null)} />
            <div className={styles.modal} role="dialog">
              <div className={styles.modalHeader}>
                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginRight: '24px' }}>
                      <label className={styles.label}>แก้ไขหัวข้อใบขอราคา</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className={styles.input}
                        style={{ fontSize: '18px', fontWeight: 700, padding: '6px 12px' }}
                        required
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>เดดไลน์เสนอราคา:</span>
                        <input
                          type="date"
                          value={editDeadline}
                          onChange={e => setEditDeadline(e.target.value)}
                          className={styles.input}
                          style={{ width: '160px', padding: '4px 8px', fontSize: '12px' }}
                          required
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={handleUpdateRFQ}
                        className={styles.actionBtn}
                        style={{ background: 'var(--gradient-green)', color: '#000', border: 'none', fontWeight: 700, padding: '8px 16px' }}
                      >
                        💾 บันทึก
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className={styles.actionBtn}
                        style={{ padding: '8px 16px' }}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--color-orange)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {selectedRFQ.rfqNumber}
                      </span>
                      <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedRFQ.title}</h2>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        วันสิ้นสุดเสนอราคา: <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>{formatDeadlineDate(selectedRFQ.dates?.deadline)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} data-no-print>
                      <button
                        onClick={() => {
                          setIsEditing(true)
                          setEditTitle(selectedRFQ.title)
                          const dl = selectedRFQ.dates?.deadline
                          const dlDate = dl ? ((dl as any).seconds ? new Date((dl as any).seconds * 1000) : new Date(dl as any)) : new Date()
                          setEditDeadline(dlDate.toISOString().split('T')[0])
                        }}
                        className={styles.actionBtn}
                        style={{ borderColor: 'var(--color-orange)', color: 'var(--color-orange)', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        onClick={() => window.print()}
                        className={styles.actionBtn}
                        style={{ borderColor: 'var(--color-blue)', color: 'var(--color-blue)', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        🖨️ พิมพ์ PDF
                      </button>
                      <button 
                        onClick={() => handleDeleteRFQ(selectedRFQ.id, selectedRFQ.rfqNumber)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-red)', cursor: 'pointer', fontSize: '13px' }}
                      >
                        🗑️ ลบขอราคา
                      </button>
                      <button onClick={() => { setSelectedRFQ(null); setIsEditing(false); }} className={styles.closeBtn}>✕</button>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.modalBody}>
                {/* Left Side: Product List */}
                <div>
                  <h3 className={styles.sectionTitle}>📦 สินค้าที่ขอราคา</h3>
                  <table className={styles.detailTable}>
                    <thead>
                      <tr>
                        <th>ชื่อสินค้า</th>
                        <th style={{ textAlign: 'center' }}>จำนวน</th>
                        <th>หน่วย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRFQ.items?.map((item, idx) => {
                        const prod = products.find(p => p.id === item.productId || p.name === item.productName)
                        const displayImgUrl = item.imageUrl || prod?.imageUrl

                        return (
                          <tr key={idx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                {displayImgUrl ? (
                                  <img
                                    src={displayImgUrl}
                                    alt={item.productName}
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      border: '1px solid var(--color-border)',
                                      flexShrink: 0
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '4px',
                                    background: '#11151F',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    flexShrink: 0
                                  }}>
                                    📦
                                  </div>
                                )}
                                <span style={{ fontWeight: 600 }}>{item.productName}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.quantity}</td>
                            <td>{item.unit}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Registered Target Suppliers list */}
                  <h3 className={styles.sectionTitle}>🏭 รายชื่อคู่ค้าที่ส่งขอราคา</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                    {selectedRFQ.targetSupplierIds?.map(sid => {
                      const sup = suppliers.find(s => s.id === sid)
                      return (
                        <span key={sid} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '4px', fontSize: '13px' }}>
                          🏢 {sup?.name || 'กำลังโหลด...'}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Right Side: Add Quote Offer Form */}
                {selectedRFQ.status !== 'converted_to_po' && (
                  <div>
                    <h3 className={styles.sectionTitle}>📥 กรอกใบเสนอราคาจากคู่ค้า</h3>
                    <form onSubmit={handleAddOffer} className={styles.offerForm}>
                      <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                        <label className={styles.label}>เลือกคู่ค้าผู้เสนอราคา *</label>
                        <select
                          required
                          value={offerSupplierId}
                          onChange={e => setOfferSupplierId(e.target.value)}
                          className={styles.select}
                        >
                          <option value="">-- เลือกคู่ค้า --</option>
                          {selectedRFQ.targetSupplierIds?.map(sid => {
                            const sup = suppliers.find(s => s.id === sid)
                            return (
                              <option key={sid} value={sid}>{sup?.name}</option>
                            )
                          })}
                        </select>
                      </div>

                      <div className={styles.formRow} style={{ marginBottom: '12px' }}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>เวลาผลิตจัดส่ง (วัน) *</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={offerLeadTime}
                            onChange={e => setOfferLeadTime(e.target.value)}
                            className={styles.input}
                            placeholder="3"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>ประเภทขนส่ง *</label>
                          <select
                            required
                            value={offerLogisticsId}
                            onChange={e => {
                              setOfferLogisticsId(e.target.value)
                              const logCh = logistics.find(l => l.id === e.target.value)
                              if (logCh) {
                                // Auto estimate price per KG if applicable
                                setOfferLogisticsCost(String(logCh.pricePerKg * 10)) // mock 10kg
                              }
                            }}
                            className={styles.select}
                          >
                            <option value="">-- เลือกช่องทาง --</option>
                            {logistics.map(log => (
                              <option key={log.id} value={log.id}>
                                {log.name} (฿{log.pricePerKg}/กก.)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                        <label className={styles.label}>ค่าจัดส่งเพิ่มเติม (฿)</label>
                        <input
                          type="number"
                          value={offerLogisticsCost}
                          onChange={e => setOfferLogisticsCost(e.target.value)}
                          className={styles.input}
                          placeholder="0"
                        />
                      </div>

                      {/* Item price inputs */}
                      <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                        <label className={styles.label}>กรอกราคาต่อหน่วยของแต่ละสินค้า *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          {selectedRFQ.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  required
                                  min={0.01}
                                  step="0.01"
                                  value={offerPrices[item.productId] || ''}
                                  onChange={e => setOfferPrices({
                                    ...offerPrices,
                                    [item.productId]: e.target.value
                                  })}
                                  className={styles.input}
                                  style={{ width: '100px', padding: '6px' }}
                                  placeholder="ราคา/หน่วย"
                                />
                                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>฿</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                        <label className={styles.label}>หมายเหตุข้อเสนอ</label>
                        <input
                          type="text"
                          value={offerNotes}
                          onChange={e => setOfferNotes(e.target.value)}
                          className={styles.input}
                          placeholder="ราคายืนยันภายใน 15 วัน..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={offerSubmitting || !offerSupplierId || !offerLogisticsId}
                        className={styles.btnPrimary}
                        style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                      >
                        {offerSubmitting ? 'กำลังบันทึก...' : 'บันทึกใบเสนอราคานี้'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Bottom Center: The Ultimate Price Compare Matrix */}
                {selectedRFQ.supplierOffers?.length > 0 && (
                  <div className={styles.compareContainer}>
                    <h3 className={styles.sectionTitle}>
                      📊 ตารางเปรียบเทียบราคาที่ดีที่สุด (Price Comparison Matrix)
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-green)' }}>
                        🟢 แถบสีเขียวคือราคาเสนอที่ต่ำที่สุด
                      </span>
                    </h3>

                    <table className={styles.matrixTable}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>รายละเอียดสินค้า / คู่ค้า</th>
                          {selectedRFQ.supplierOffers.map(offer => (
                            <th key={offer.id}>
                              <div>🏢 {offer.supplierName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '2px' }}>
                                จัดส่ง: {offer.leadTimeDays} วัน
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRFQ.items?.map((item, itemIdx) => {
                          // Find minimum unit price for this product
                          const pricesList = selectedRFQ.supplierOffers.map(o => 
                            o.prices.find(p => p.productId === item.productId)?.unitPrice || Infinity
                          )
                          const minPrice = Math.min(...pricesList)

                          return (
                            <tr key={itemIdx}>
                              <td style={{ textAlign: 'left', fontWeight: 600 }}>
                                {item.productName} <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>({item.quantity} {item.unit})</span>
                              </td>
                              {selectedRFQ.supplierOffers.map(offer => {
                                const uPrice = offer.prices.find(p => p.productId === item.productId)?.unitPrice || 0
                                const isLowest = uPrice === minPrice && minPrice !== Infinity

                                return (
                                  <td key={offer.id} className={isLowest ? styles.lowestPrice : ''}>
                                    <div style={{ fontWeight: isLowest ? 700 : 500 }}>฿{uPrice.toLocaleString()}/หน่วย</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                      รวม: ฿{(uPrice * item.quantity).toLocaleString()}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}

                        {/* Logistics cost row */}
                        <tr>
                          <td style={{ textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                            🚚 ค่าขนส่งเฉลี่ย
                          </td>
                          {selectedRFQ.supplierOffers.map(offer => (
                            <td key={offer.id} style={{ color: 'var(--color-text-muted)' }}>
                              ฿{offer.logisticsCost.toLocaleString()}
                            </td>
                          ))}
                        </tr>

                        {/* Grand Total row */}
                        <tr style={{ background: 'rgba(255,255,255,0.01)', borderTop: '2px solid var(--color-border)' }}>
                          <td style={{ textAlign: 'left', fontWeight: 700, fontSize: '15px' }}>
                            💰 ราคารวมสุทธิทั้งหมด
                          </td>
                          {selectedRFQ.supplierOffers.map(offer => {
                            const allTotals = selectedRFQ.supplierOffers.map(o => o.totalAmount)
                            const minTotal = Math.min(...allTotals)
                            const isCheapest = offer.totalAmount === minTotal

                            return (
                              <td key={offer.id} className={isCheapest ? styles.lowestPrice : ''}>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: isCheapest ? 'var(--color-green)' : 'var(--color-text)' }}>
                                  ฿{offer.totalAmount.toLocaleString()}
                                </div>
                                
                                {selectedRFQ.status !== 'converted_to_po' ? (
                                  <button
                                    onClick={() => handleConvertToPO(offer)}
                                    className={`${styles.actionBtn} ${isCheapest ? styles.btnGreen : styles.btnPrimary}`}
                                    style={{ marginTop: '10px', width: '100%', padding: '6px' }}
                                  >
                                    อนุมัติเปิด PO 📦
                                  </button>
                                ) : (
                                  selectedRFQ.selectedOfferId === offer.id && (
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-green)', fontWeight: 700, marginTop: '8px' }}>
                                      ✅ ได้รับอนุมัติเปิด PO แล้ว
                                    </span>
                                  )
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Hidden Printing Template for PDF Download */}
      <div className="print-document" style={{ display: 'none' }}>
        <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '12pt', marginBottom: '16pt' }}>
          <div>
            <h1 style={{ fontSize: '24pt', fontWeight: 700, margin: 0 }}>ใบขอราคาสินค้า</h1>
            <p style={{ fontSize: '12pt', color: '#555', marginTop: '4pt', margin: 0 }}>Request for Quotation (RFQ)</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16pt', fontWeight: 700, color: '#FF7A00' }}>{selectedRFQ?.rfqNumber}</div>
            <div style={{ fontSize: '10pt', color: '#555', marginTop: '4pt' }}>
              วันที่ออกเอกสาร: {selectedRFQ?.dates?.issued ? formatDeadlineDate(selectedRFQ.dates.issued) : '-'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20pt', marginBottom: '20pt' }}>
          <div>
            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '4pt', marginBottom: '8pt', marginTop: 0 }}>ผู้ขอราคา</h3>
            <p style={{ fontWeight: 600, margin: '0 0 4pt 0' }}>บริษัท จัดซื้อและจัดจ้าง จำกัด</p>
            <p style={{ color: '#555', margin: 0 }}>แผนกจัดซื้อกลาง</p>
          </div>
          <div>
            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '4pt', marginBottom: '8pt', marginTop: 0 }}>ข้อมูลทั่วไป</h3>
            <p style={{ margin: '0 0 4pt 0' }}><strong>หัวข้อ:</strong> {selectedRFQ?.title}</p>
            <p style={{ margin: 0 }}><strong>วันสิ้นสุดเสนอราคา (Deadline):</strong> {selectedRFQ?.dates?.deadline ? formatDeadlineDate(selectedRFQ.dates.deadline) : '-'}</p>
          </div>
        </div>

        <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '4pt', marginBottom: '8pt' }}>รายการสินค้าที่ต้องการ (Items Requested)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30pt' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8pt', textAlign: 'left', fontWeight: 600 }}>ลำดับ</th>
              <th style={{ border: '1px solid #ccc', padding: '8pt', textAlign: 'left', fontWeight: 600 }}>รายการสินค้า</th>
              <th style={{ border: '1px solid #ccc', padding: '8pt', textAlign: 'center', fontWeight: 600 }}>จำนวน</th>
              <th style={{ border: '1px solid #ccc', padding: '8pt', textAlign: 'left', fontWeight: 600 }}>หน่วยนับ</th>
            </tr>
          </thead>
          <tbody>
            {selectedRFQ?.items?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '8pt' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8pt', fontWeight: 600 }}>{item.productName}</td>
                <td style={{ border: '1px solid #ccc', padding: '8pt', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ border: '1px solid #ccc', padding: '8pt' }}>{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', marginTop: '80pt', textAlign: 'center' }}>
          <div>
            <div style={{ borderBottom: '1px solid #000', width: '200px', margin: '0 auto 8pt auto', height: '40px' }}></div>
            <p style={{ fontSize: '10pt', margin: 0 }}>ผู้จัดเตรียม</p>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #000', width: '200px', margin: '0 auto 8pt auto', height: '40px' }}></div>
            <p style={{ fontSize: '10pt', margin: 0 }}>ผู้จัดการแผนกจัดซื้อ (อนุมัติ)</p>
          </div>
        </div>
      </div>
    </>
  )
}
