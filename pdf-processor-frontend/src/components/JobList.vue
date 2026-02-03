<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import * as XLSX from 'xlsx'

// 定义任务数据结构
interface Job {
  id: number
  file_name: string
  file_path: string
  status: string // '待处理' | '处理中' | '处理完成'
  uploaded_at: string
}

const jobs = ref<Job[]>([])
const loading = ref(false)

// 获取任务列表
const fetchJobs = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('pdf_jobs')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('获取任务列表失败:', error)
  } else {
    jobs.value = data || []
  }
  loading.value = false
}

// 下载文件逻辑
const handleDownload = async (job: Job) => {
  if (job.status !== '处理完成') return

  try {
    console.log('正在查询解析数据，匹配 source_file:', job.file_path)

    // 1. 根据 source_file (即 file_path) 查询 clinic_data 表
    const { data, error } = await supabase
      .from('clinic_data')
      .select('*')
      .eq('source_file', job.file_path)

    if (error) throw error

    if (!data || data.length === 0) {
      console.warn('未找到数据，请检查数据库 clinic_data 表中 source_file 字段是否匹配:', job.file_path)
      alert(`未找到该文件的解析数据\n(查询的 source_file 为: ${job.file_path})`)
      return
    }

    // 2. 将 JSON 数据转换为 Excel 并下载
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clinic Data')
    
    // 生成文件名 (将 .pdf 替换为 .xlsx)
    const fileName = job.file_name.replace(/\.[^/.]+$/, "") + ".xlsx"
    XLSX.writeFile(workbook, fileName)
  } catch (error: any) {
    console.error('下载出错:', error)
    alert('下载失败: ' + error.message)
  }
}

onMounted(() => {
  fetchJobs()

  // 开启实时订阅，当状态更新时自动刷新列表
  supabase
    .channel('public:pdf_jobs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pdf_jobs' }, fetchJobs)
    .subscribe()
})
</script>

<template>
  <div class="job-board">
    <h3>任务看板</h3>
    <div v-if="loading && jobs.length === 0">加载中...</div>
    
    <table v-else class="job-table">
      <thead>
        <tr>
          <th>文件名</th>
          <th>状态</th>
          <th style="width: 120px;">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="job in jobs" :key="job.id">
          <td>{{ job.file_name }}</td>
          <td>
            <span :class="['status-tag', job.status === '处理完成' ? 'completed' : '']">
              {{ job.status }}
            </span>
          </td>
          <td>
            <!-- 关键点：根据状态动态绑定样式和禁用属性 -->
            <button 
              class="download-btn"
              :class="job.status === '处理完成' ? 'btn-green' : 'btn-gray'"
              :disabled="job.status !== '处理完成'"
              @click="handleDownload(job)"
            >
              {{ job.status === '处理完成' ? '下载结果' : '等待中' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.job-board {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.job-table {
  width: 100%;
  border-collapse: collapse;
}

.job-table th, .job-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.download-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  transition: background-color 0.2s;
}

/* 未完成：灰色不可点 */
.btn-gray {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 完成：绿色可点 */
.btn-green {
  background-color: #42b983;
  cursor: pointer;
}
.btn-green:hover {
  background-color: #3aa876;
}

.status-tag {
  font-size: 0.9em;
  color: #666;
}
.status-tag.completed {
  color: #42b983;
  font-weight: bold;
}
</style>