<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useLocalVaultStore } from '@/stores/localVault'

const { initTheme } = useTheme()
const localVaultStore = useLocalVaultStore()

onMounted(async () => {
  initTheme()
  await localVaultStore.init()
})
</script>
