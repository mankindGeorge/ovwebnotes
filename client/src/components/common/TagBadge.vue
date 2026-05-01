<template>
  <span
    :class="[
      'inline-flex items-center rounded-full font-medium transition-colors cursor-pointer',
      size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-2.5 py-0.5 text-sm',
      active
        ? 'bg-obsidian-200 dark:bg-obsidian-800 text-obsidian-800 dark:text-obsidian-200 shadow-sm'
        : 'bg-warm-hover dark:bg-vault-highlight text-warm-text-secondary dark:text-vault-muted hover:bg-warm-active dark:hover:bg-vault-border shadow-sm hover:shadow-md transition-all duration-200',
    ]"
    @click="$emit('click')"
  >
    #{{ tag }}
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tag: string
    active?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    active: false,
    size: 'md',
  }
)

defineEmits<{
  click: []
}>()
</script>
