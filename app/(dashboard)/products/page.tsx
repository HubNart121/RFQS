'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import Topbar from '@/components/layout/Topbar'
import { db, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from '@/lib/firebase/firestore'
import { uploadProductImage } from '@/lib/firebase/storage'
import { logAction } from '@/lib/hooks/useAuditLog'
import { Product } from '@/lib/types'
import styles from './products.module.css'

const CATEGORIES = [
  { value: 'Raw Materials', label: 'วัตถุดิบหลัก (Raw Materials)' },
  { value: 'Packaging', label: 'บรรจุภัณฑ์ (Packaging)' },
  { value: 'Office Supplies', label: 'อุปกรณ์สำนักงาน (Office Supplies)' },
  { value: 'Spare Parts', label: 'อะไหล่/เครื่องมือ (Spare Parts)' },
  { value: 'Finished Goods', label: 'สินค้าสำเร็จรูป (Finished Goods)' },
  { value: 'Others', label: 'อื่นๆ (Others)' }
]

const UNITS = ['ชิ้น', 'กล่อง', 'ถุง', 'กิโลกรัม (kg)', 'ตัน', 'เมตร', 'ลิตร', 'คู่', 'โหล']

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [unit, setUnit] = useState('ชิ้น')
  const [category, setCategory] = useState('Raw Materials')
  const [lastPrice, setLastPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Real-time Fetch from Firestore
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product)
      })
      setProducts(data)
      setLoading(false)
    }, (error) => {
      console.error('[Products] Fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Handle Image Change
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Add Product
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !sku) return

    setSubmitting(true)
    try {
      let imageUrl = ''
      let imageThumb = ''

      // If an image is selected, compress & convert to Base64 using our local helper
      if (imageFile) {
        console.log('Compressing & converting image to Base64...');
        const tempId = sku || Math.random().toString(36).substring(7)
        const images = await uploadProductImage(imageFile, tempId)
        imageUrl = images.url
        imageThumb = images.thumbUrl
        console.log('Image processing completed!');
      }

      const newProduct = {
        name,
        sku: sku.toUpperCase(),
        unit,
        category,
        lastPrice: Number(lastPrice) || 0,
        description,
        imageUrl,
        imageThumb,
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'products'), newProduct)
      
      await logAction({
        action: 'ADD_PRODUCT',
        targetId: docRef.id,
        targetType: 'product',
        details: `เพิ่มสินค้าใหม่: ${name} (SKU: ${sku.toUpperCase()})`
      })

      // Reset form & close
      setName('')
      setSku('')
      setUnit('ชิ้น')
      setCategory('Raw Materials')
      setLastPrice('')
      setDescription('')
      setImageFile(null)
      setImagePreview(null)
      setIsOpen(false)
    } catch (err) {
      console.error('[Products] Create error:', err)
      alert('เกิดข้อผิดพลาดในการบันทึกสินค้า กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Product
  async function handleDelete(id: string, productName: string) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า "${productName}"?`)) return

    try {
      await deleteDoc(doc(db, 'products', id))
      await logAction({
        action: 'DELETE_PRODUCT',
        targetId: id,
        targetType: 'product',
        details: `ลบสินค้า: ${productName}`
      })
    } catch (err) {
      console.error('[Products] Delete error:', err)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  // Filtered Products
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase()) ||
    product.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Topbar title="คลังสินค้า" />
      
      <section className={styles.container}>
        {/* Header bar */}
        <div className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <h1>คลังสินค้า (Product Catalog)</h1>
            <p>ลงทะเบียน ค้นหา และบริหารคลังรายการสินค้าและวัสดุทั้งหมดในระบบ</p>
          </div>
          <button onClick={() => setIsOpen(true)} className={styles.addBtn}>
            <span>+</span> เพิ่มสินค้าใหม่
          </button>
        </div>

        {/* Action bar (Search) */}
        <div className={styles.actionBar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า, SKU, หมวดหมู่สินค้า..."
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
        ) : filteredProducts.length > 0 ? (
          /* Cards Grid */
          <div className={styles.grid}>
            {filteredProducts.map(product => (
              <article key={product.id} className={styles.card}>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className={styles.deleteBtn}
                  title="ลบสินค้า"
                >
                  ✕
                </button>

                <div className={styles.imageWrapper}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className={styles.productImage}
                    />
                  ) : (
                    <span className={styles.noImage}>📦</span>
                  )}
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.metaRow}>
                    <span className={styles.category}>
                      {CATEGORIES.find(c => c.value === product.category)?.label.split(' ')[0] || product.category}
                    </span>
                    <span className={styles.sku}>{product.sku}</span>
                  </div>
                  <h3 className={styles.productName}>{product.name}</h3>

                  <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>ราคากลางล่าสุด / {product.unit || 'ชิ้น'}</span>
                    <span className={styles.price}>
                      {product.lastPrice ? `฿${product.lastPrice.toLocaleString()}` : 'ไม่ระบุ'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🗂️</div>
            <h3>ยังไม่มีสินค้าในระบบ</h3>
            <p>{search ? 'ไม่พบสินค้าที่ตรงกับการค้นหาของคุณ' : 'กดปุ่ม "เพิ่มสินค้าใหม่" ด้านบนเพื่อเริ่มจัดเก็บรายการสินค้า'}</p>
          </div>
        )}

        {/* Drawer slide-over */}
        {isOpen && (
          <>
            <div className={styles.overlay} onClick={() => setIsOpen(false)} />
            <div className={styles.drawer} role="dialog" aria-modal="true">
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>เพิ่มสินค้าใหม่</h2>
                <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Image Uploader */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>รูปภาพสินค้า</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.uploaderContainer}
                  >
                    {imagePreview ? (
                      <div className={styles.previewWrapper}>
                        <img src={imagePreview} alt="Preview" className={styles.previewImage} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setImageFile(null)
                            setImagePreview(null)
                          }}
                          className={styles.removeImageBtn}
                        >
                          ลบรูป
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.uploaderIcon}>📸</span>
                        <span className={styles.uploaderText}>คลิกเพื่อถ่ายรูป หรือ อัปโหลดไฟล์รูปภาพ</span>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>ชื่อสินค้า *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={styles.input}
                    placeholder="เหล็กแผ่นชุบสังกะสีหนา 2.0 มม."
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>รหัสสินค้า (SKU) *</label>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      className={styles.input}
                      placeholder="SKU-STEEL-001"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>หน่วยนับ *</label>
                    <select
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      className={styles.select}
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>หมวดหมู่สินค้า *</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className={styles.select}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>ราคากลางล่าสุด (฿)</label>
                    <input
                      type="number"
                      value={lastPrice}
                      onChange={e => setLastPrice(e.target.value)}
                      className={styles.input}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>คำอธิบาย / รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={styles.textarea}
                    placeholder="เหล็กเกรดอุตสาหกรรมชุบกันสนิมพิเศษ..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !name || !sku}
                  className={styles.submitBtn}
                >
                  {submitting ? 'กำลังบันทึก (และย่อรูปภาพ)...' : 'บันทึกข้อมูลสินค้า'}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </>
  )
}
