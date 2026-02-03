<script setup>
import PdfUploader from './components/PdfUploader.vue';
import JobList from './components/JobList.vue';
</script>

<template>
  <div id="main-container">
    <header>
      <h1>PDF 医疗数据处理系统</h1>
    </header>
    <main>
      <PdfUploader />
      <JobList />
    </main>
  </div>
</template>

<style scoped>
#main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #2c3e50;
}

header {
  border-bottom: 2px solid #e0e6f0;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a5a96; /* Medical blue */
}
</style>
