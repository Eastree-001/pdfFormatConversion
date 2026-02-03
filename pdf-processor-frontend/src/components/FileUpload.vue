<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../supabase'

const uploading = ref(false)

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  // 关键点 1: 获取原生的 File 对象
  const file = input.files[0]
  uploading.value = true

  try {
    // 生成唯一文件名，避免覆盖
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`
    // 如果你想放在 uploads 文件夹下，可以写 `uploads/${fileName}`
    const storagePath = fileName 

    // 关键点 2: 直接上传 file 对象，不要进行任何转换
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs') // 确保 Bucket 名称正确
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf' // 显式指定类型
      })

    if (uploadError) throw uploadError

    // 关键点 3: 将返回的 path 存入数据库
    const { error: dbError } = await supabase
      .from('pdf_jobs')
      .insert({
        file_name: file.name,       // 原始文件名（用于显示）
        file_path: uploadData.path, // Storage 里的实际路径（用于下载）
        status: '待处理',
        clinic_count: 0,
        uploaded_at: new Date().toISOString()
      })

    if (dbError) throw dbError

    alert('上传成功！请等待列表刷新。')
  } catch (error: any) {
    console.error('上传出错:', error)
    alert('上传失败: ' + error.message)
  } finally {
    uploading.value = false
    input.value = '' // 清空输入框，允许重复上传同名文件
  }
}
</script>

<template>
  <div class="upload-section">
    <input 
      type="file" 
      accept="application/pdf" 
      @change="handleFileUpload" 
      :disabled="uploading" 
    />
    <span v-if="uploading" style="margin-left: 10px; color: #666;">正在上传...</span>
  </div>
</template>

<style scoped>
.upload-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>