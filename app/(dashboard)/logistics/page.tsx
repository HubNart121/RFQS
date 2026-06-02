'use client'

import { useState, useEffect, FormEvent } from 'react'
import Topbar from '@/components/layout/Topbar'
import { db, collection, addDoc, onSnapshot, query, updateDoc, deleteDoc, doc } from '@/lib/firebase/firestore'
import { logAction } from '@/lib/hooks/useAuditLog'
import { Logistics, LogisticsType } from '@/lib/types'
import styles from './logistics.module.css'

const LOGISTICS_TYPES: { value: LogisticsType; label: string; icon: string }[] = [
  { value: 'land', label: 'การขนส่งทางบก (Land)', icon: '🚚' },
  { value: 'air', label: 'การขนส่งทางอากาศ (Air)', icon: '✈️' },
  { value: 'sea', label: 'การขนส่งทางน้ำ/เรือ (Sea)', icon: '🚢' },
  { value: 'self', label: 'รับสินค้าด้วยตนเอง (Self)', icon: '🚶' }
]

export default function LogisticsPage() {
  const [channels, setChannels] = useState<Logistics[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState<LogisticsType>('land')
  const [contactPhone, setContactPhone] = useState('')
  const [pricePerKg, setPricePerKg] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Real-time Fetch from Firestore
  useEffect(() => {
    const q = query(collection(db, 'logistics'))
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data: Logistics[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Logistics)
      })

      // If empty, auto-populate default channels for premium experience
      if (data.length === 0 && snapshot.metadata.fromCache === false) {
        console.log('Logistics database empty. Auto-populating default channels...')
        const defaults = [
          { name: 'ขนส่งด่วนทางบก (Thai Express)', type: 'land', contactPhone: '02-111-2222', pricePerKg: 15, estimatedDays: 2, isActive: true },
          { name: 'ขนส่งด่วนพิเศษทางอากาศ (Air Cargo)', type: 'air', contactPhone: '02-333-4444', pricePerKg: 120, estimatedDays: 1, isActive: true },
          { name: 'จัดส่งทางตู้คอนเทนเนอร์ (Ocean Logistics)', type: 'sea', contactPhone: '02-555-6666', pricePerKg: 5, estimatedDays: 15, isActive: true },
          { name: 'รับสินค้าด้วยตนเอง (Self Pickup)', type: 'self', contactPhone: '-', pricePerKg: 0, estimatedDays: 0, isActive: true }
        ]
        
        for (const item of defaults) {
          await addDoc(collection(db, 'logistics'), item)
        }
      }

      setChannels(data)
      setLoading(false)
    }, (error) => {
      console.error('[Logistics] Fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Toggle Active Status
  async function handleToggleActive(id: string, currentStatus: boolean, providerName: string) {
    try {
      await updateDoc(doc(db, 'logistics', id), { isActive: !currentStatus })
      await logAction({
        action: 'UPDATE_PRODUCT', // Reuse update log code
        targetId: id,
        targetType: 'logistics',
        details: `เปลี่ยนสถานะขนส่ง ${providerName}: ${!currentStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`
      })
    } catch (err) {
      console.error('[Logistics] Toggle error:', err)
      alert('ไม่สามารถอัปเดตสถานะได้')
    }
  }

  // Add Logistics Channel
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !contactPhone) return

    setSubmitting(true)
    try {
      const newChannel = {
        name,
        type,
        contactPhone,
        pricePerKg: Number(pricePerKg) || 0,
        estimatedDays: Number(estimatedDays) || 0,
        isActive: true
      }

      await addDoc(collection(db, 'logistics'), newChannel)
      
      await logAction({
        action: 'ADD_PRODUCT',
        targetType: 'logistics',
        details: `เพิ่มช่องทางขนส่งใหม่: ${name} (${type})`
      })

      // Reset form & close
      setName('')
      setType('land')
      setContactPhone('')
      setPricePerKg('')
      setEstimatedDays('')
      setIsOpen(false)
    } catch (err) {
      console.error('[Logistics] Create error:', err)
      alert('เกิดข้อผิดพลาดในการบันทึกช่องทางขนส่ง')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Logistics Channel
  async function handleDelete(id: string, providerName: string) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบช่องทางขนส่ง "${providerName}"?`)) return

    try {
      await deleteDoc(doc(db, 'logistics', id))
      await logAction({
        action: 'DELETE_PRODUCT',
        targetId: id,
        targetType: 'logistics',
        details: `ลบช่องทางขนส่ง: ${providerName}`
      })
    } catch (err) {
      console.error('[Logistics] Delete error:', err)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  return (
    <>
      <Topbar title="การขนส่ง" />
      
      <section className={styles.container}>
        {/* Header bar */}
        <div className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <h1>ช่องทางการขนส่ง (Logistics)</h1>
            <p>ตั้งค่าผู้ให้บริการขนส่ง ระยะเวลาจัดส่งเฉลี่ย และราคาเฉลี่ยต่อกิโลกรัมสำหรับคำนวณราคาจัดซื้อ</p>
          </div>
          <button onClick={() => setIsOpen(true)} className={styles.addBtn}>
            <span>+</span> เพิ่มช่องทางจัดส่ง
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="animate-spin" style={{ fontSize: '32px' }}>🔄</span>
          </div>
        ) : channels.length > 0 ? (
          /* Cards Grid */
          <div className={styles.grid}>
            {channels.map(channel => {
              const typeDetails = LOGISTICS_TYPES.find(t => t.value === channel.type)
              return (
                <article key={channel.id} className={styles.card}>
                  <div>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.providerName}>{channel.name}</h3>
                      <span className={`${styles.typeBadge} ${styles['type-' + channel.type]}`}>
                        {typeDetails?.icon} {typeDetails?.label.split(' ')[0]}
                      </span>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.infoRow}>
                        <span>เบอร์ติดต่อ:</span>
                        <span className={styles.infoValue}>{channel.contactPhone}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span>ค่าขนส่งเฉลี่ย:</span>
                        <span className={styles.infoValue}>
                          {channel.pricePerKg ? `฿${channel.pricePerKg}/กก.` : 'ไม่มีค่าบริการ (ฟรี)'}
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <span>ระยะเวลาเดินทางเฉลี่ย:</span>
                        <span className={styles.infoValue}>
                          {channel.estimatedDays ? `${channel.estimatedDays} วัน` : 'จัดส่งทันที (0 วัน)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.statusWrapper}>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={channel.isActive}
                          onChange={() => handleToggleActive(channel.id, channel.isActive, channel.name)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                      <span className={`${styles.statusText} ${channel.isActive ? styles.statusTextActive : ''}`}>
                        {channel.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(channel.id, channel.name)}
                      className={styles.deleteBtn}
                      title="ลบช่องทาง"
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* Empty state */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🚚</div>
            <h3>ยังไม่มีข้อมูลการขนส่ง</h3>
            <p>กดปุ่ม "เพิ่มช่องทางจัดส่ง" ด้านบนเพื่อเริ่มลงทะเบียนคู่ค้าขนส่ง</p>
          </div>
        )}

        {/* Drawer slide-over */}
        {isOpen && (
          <>
            <div className={styles.overlay} onClick={() => setIsOpen(false)} />
            <div className={styles.drawer} role="dialog" aria-modal="true">
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>เพิ่มช่องทางขนส่งใหม่</h2>
                <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>ชื่อบริษัทขนส่ง / บริการ *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={styles.input}
                    placeholder="SCG Logistics, ไปรษณีย์ไทย ฯลฯ"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>ประเภทการขนส่ง *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as LogisticsType)}
                    className={styles.select}
                  >
                    {LOGISTICS_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>เบอร์โทรศัพท์ติดต่อประสานงาน *</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className={styles.input}
                    placeholder="081-234-5678"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>ค่าจัดส่งเฉลี่ยต่อ กิโลกรัม (฿)</label>
                    <input
                      type="number"
                      value={pricePerKg}
                      onChange={e => setPricePerKg(e.target.value)}
                      className={styles.input}
                      placeholder="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>ระยะเวลาเดินทางเฉลี่ย (วัน)</label>
                    <input
                      type="number"
                      value={estimatedDays}
                      onChange={e => setEstimatedDays(e.target.value)}
                      className={styles.input}
                      placeholder="0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !name || !contactPhone}
                  className={styles.submitBtn}
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกช่องทางขนส่ง'}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </>
  )
}
