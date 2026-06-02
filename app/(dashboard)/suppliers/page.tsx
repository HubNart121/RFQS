'use client'

import { useState, useEffect, FormEvent } from 'react'
import Topbar from '@/components/layout/Topbar'
import { db, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from '@/lib/firebase/firestore'
import { logAction } from '@/lib/hooks/useAuditLog'
import { Supplier } from '@/lib/types'
import styles from './suppliers.module.css'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Net 30')
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  // Real-time Fetch from Firestore
  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Supplier[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Supplier)
      })
      setSuppliers(data)
      setLoading(false)
    }, (error) => {
      console.error('[Suppliers] Fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Add Supplier
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !contactName || !email || !phone) return

    setSubmitting(true)
    try {
      const newSupplier = {
        name,
        contactName,
        email,
        phone,
        address,
        taxId,
        paymentTerms,
        rating: Number(rating),
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'suppliers'), newSupplier)
      
      await logAction({
        action: 'ADD_SUPPLIER',
        targetId: docRef.id,
        targetType: 'supplier',
        details: `เพิ่มคู่ค้าใหม่: ${name} (${email})`
      })

      // Reset form & close
      setName('')
      setContactName('')
      setEmail('')
      setPhone('')
      setAddress('')
      setTaxId('')
      setPaymentTerms('Net 30')
      setRating(5)
      setIsOpen(false)
    } catch (err) {
      console.error('[Suppliers] Create error:', err)
      alert('เกิดข้อผิดพลาดในการบันทึกคู่ค้า กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Supplier
  async function handleDelete(id: string, supplierName: string) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบคู่ค้า "${supplierName}"?`)) return

    try {
      await deleteDoc(doc(db, 'suppliers', id))
      await logAction({
        action: 'DELETE_SUPPLIER',
        targetId: id,
        targetType: 'supplier',
        details: `ลบคู่ค้า: ${supplierName}`
      })
    } catch (err) {
      console.error('[Suppliers] Delete error:', err)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.taxId?.includes(search)
  )

  return (
    <>
      <Topbar title="คู่ค้า (Suppliers)" />
      
      <section className={styles.container}>
        {/* Header bar */}
        <div className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <h1>คู่ค้า (Suppliers)</h1>
            <p>ลงทะเบียนและจัดการรายชื่อผู้จัดจำหน่าย/คู่ค้าทั้งหมดในระบบ</p>
          </div>
          <button onClick={() => setIsOpen(true)} className={styles.addBtn}>
            <span>+</span> เพิ่มคู่ค้าใหม่
          </button>
        </div>

        {/* Action bar (Search) */}
        <div className={styles.actionBar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, ชื่อผู้ติดต่อ, อีเมล, เลขผู้เสียภาษี..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="animate-spin" style={{ fontSize: '32px' }}>🔄</span>
          </div>
        ) : filteredSuppliers.length > 0 ? (
          /* Cards Grid */
          <div className={styles.grid}>
            {filteredSuppliers.map(supplier => (
              <article key={supplier.id} className={styles.card}>
                <div>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.companyName}>{supplier.name}</h3>
                    <div className={styles.ratingBadge}>
                      <span>⭐️</span> {supplier.rating || 5}.0
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>👤</span>
                      <span>{supplier.contactName}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>✉️</span>
                      <span>{supplier.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>📞</span>
                      <span>{supplier.phone}</span>
                    </div>
                    {supplier.taxId && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>📝</span>
                        <span>เลขผู้เสียภาษี: {supplier.taxId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.paymentTerms}>{supplier.paymentTerms || 'Net 30'}</span>
                  <button
                    onClick={() => handleDelete(supplier.id, supplier.name)}
                    className={styles.deleteBtn}
                    title="ลบคู่ค้า"
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏭</div>
            <h3>ยังไม่มีข้อมูลคู่ค้าในระบบ</h3>
            <p>{search ? 'ไม่พบข้อมูลคู่ค้าที่ตรงกับการค้นหาของคุณ' : 'กดปุ่ม "เพิ่มคู่ค้าใหม่" ด้านบนเพื่อลงทะเบียนคู่ค้ารายแรก'}</p>
          </div>
        )}

        {/* Drawer slide-over */}
        {isOpen && (
          <>
            <div className={styles.overlay} onClick={() => setIsOpen(false)} />
            <div className={styles.drawer} role="dialog" aria-modal="true">
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>ลงทะเบียนคู่ค้าใหม่</h2>
                <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>ชื่อบริษัท / ร้านค้า *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={styles.input}
                    placeholder="บริษัท จัดซื้อจัดจ้าง จำกัด"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>ชื่อผู้ติดต่อประสานงาน *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className={styles.input}
                    placeholder="คุณ สมชาย มั่นคง"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>อีเมลติดต่อ *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={styles.input}
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>เบอร์โทรศัพท์ *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className={styles.input}
                      placeholder="081-234-5678"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>เลขประจำตัวผู้เสียภาษี</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    className={styles.input}
                    placeholder="0105560000000"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>เงื่อนไขการชำระเงิน (Credit Terms)</label>
                    <select
                      value={paymentTerms}
                      onChange={e => setPaymentTerms(e.target.value)}
                      className={styles.select}
                    >
                      <option value="Cash">เงินสด (Cash)</option>
                      <option value="Net 7">Net 7</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>ระดับความน่าเชื่อถือ (Rating)</label>
                    <select
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      className={styles.select}
                    >
                      <option value={5}>⭐️⭐️⭐️⭐️⭐️ (5/5)</option>
                      <option value={4}>⭐️⭐️⭐️⭐️ (4/5)</option>
                      <option value={3}>⭐️⭐️⭐️ (3/5)</option>
                      <option value={2}>⭐️⭐️ (2/5)</option>
                      <option value={1}>⭐️ (1/5)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>ที่อยู่บริษัท / รายละเอียดทางบัญชี</label>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className={styles.textarea}
                    placeholder="123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !name || !contactName || !email || !phone}
                  className={styles.submitBtn}
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลคู่ค้า'}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </>
  )
}
