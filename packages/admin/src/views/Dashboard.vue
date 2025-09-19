<template>
  <div class="dashboard">
    <el-container>
      <el-header>
        <h1>MiniModules Admin Dashboard</h1>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <span>Welcome to the Admin Dashboard</span>
          </template>
          <div>
            <p>This is the main dashboard for managing your MiniModules platform.</p>
            <el-button type="primary" @click="checkApiHealth">Check API Health</el-button>
            <div v-if="apiStatus" class="api-status">
              <p><strong>API Status:</strong> {{ apiStatus }}</p>
            </div>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const apiStatus = ref('')

const checkApiHealth = async () => {
  try {
    // Get the current domain to make proper API calls in Replit environment
    const domain = window.location.origin.replace(':5000', ':3000')
    const response = await axios.get(`${domain}/health`)
    apiStatus.value = `${response.data.status} (${response.data.timestamp})`
  } catch (error) {
    apiStatus.value = 'Error connecting to API'
    console.error('API health check failed:', error)
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.api-status {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
}
</style>