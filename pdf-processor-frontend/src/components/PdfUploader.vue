<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../supabase'

const uploading = ref(false)
const uploadStatus = ref('')

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  uploading.value = true
  uploadStatus.value = '正在上传...'

  try {
    // 1. 生成唯一文件名以避免冲突
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    // 2. 上传文件到 Supabase Storage (假设 Bucket 名为 'pdfs')
    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // 3. 在数据库中创建任务记录
    const { error: dbError } = await supabase
      .from('pdf_jobs')
      .insert({
        file_name: file.name,
        file_path: filePath,
        status: '待处理',
        clinic_count: 0
      })

    if (dbError) throw dbError

    uploadStatus.value = '上传成功！文件已进入处理队列。'
    // 清空输入框
    input.value = ''
  } catch (error: any) {
    console.error('Error uploading:', error)
    uploadStatus.value = `上传失败: ${error.message || '未知错误'}`
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="uploader-container">
    <h2>上传 PDF 文件</h2>
    <p class="subtitle">请选择需要处理的医疗 PDF 文档</p>
    
    <div class="upload-box">
      <input 
        type="file" 
        accept=".pdf" 
        @change="handleFileUpload" 
        :disabled="uploading" 
        class="file-input"
      />
    </div>

    <p v-if="uploadStatus" :class="['status-msg', { error: uploadStatus.includes('失败') }]">
      {{ uploadStatus }}
    </p>
  </div>
</template>

<style scoped>
.uploader-container {
  text-align: center;
}

.subtitle {
  color: #666;
  margin-bottom: 20px;
}

.upload-box {
  border: 2px dashed var(--primary-blue, #007bff);
  border-radius: 8px;
  padding: 40px;
  background-color: #f8f9fa;
  transition: background-color 0.3s;
}

.upload-box:hover {
  background-color: #e9ecef;
}

.file-input {
  font-size: 1.1rem;
}

.status-msg {
  margin-top: 20px;
  font-weight: bold;
  color: #28a745;
}

.status-msg.error {
  color: #dc3545;
}
</style>