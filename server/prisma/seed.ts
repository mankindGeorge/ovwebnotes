import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 创建示例笔记
  const note1 = await prisma.note.create({
    data: {
      title: '欢迎使用 Ovwebnotes',
      content: '# 欢迎使用 Ovwebnotes\n\n这是一个混合存储笔记系统，支持本地文件和云端数据库双模式。\n\n## 功能特性\n\n- 本地 Markdown 文件管理\n- 云端数据库存储\n- Git 自动同步\n- AI 智能摘要\n- Web 剪藏',
      tags: ['欢迎', '入门', '教程'],
      is_cloud: true,
      folderPath: '/ Guides',
      filePath: '/Guides/欢迎.md',
    },
  });

  const note2 = await prisma.note.create({
    data: {
      title: 'Markdown 语法速查',
      content:
        '# Markdown 语法速查\n\n## 标题\n\n使用 `#` 号表示标题级别。\n\n## 列表\n\n- 无序列表项 1\n- 无序列表项 2\n\n## 代码\n\n```typescript\nconst hello = "world";\n```\n\n## 引用\n\n> 这是一段引用文字',
      tags: ['Markdown', '语法', '参考'],
      is_cloud: true,
      folderPath: '/ References',
      filePath: '/References/Markdown语法速查.md',
    },
  });

  // 创建示例附件
  await prisma.attachment.create({
    data: {
      noteId: note1.id,
      fileName: 'screenshot.png',
      filePath: '/uploads/screenshot.png',
      fileType: 'image/png',
      size: 102400,
      is_cloud: false,
    },
  });

  // 创建同步日志
  await prisma.syncLog.create({
    data: {
      status: 'success',
      message: '初始种子数据同步完成',
    },
  });

  console.log('Seeding completed!');
  console.log(`Created ${2} notes, 1 attachment, 1 sync log.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
