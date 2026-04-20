/**
 * Farmer Process & Diary Screen Examples
 * Các ví dụ sử dụng màn hình Quy trình và Nhật ký
 */

import React from 'react';
import { FarmerProcessScreen, Task, DiaryEntry } from './FarmerProcessScreen';

/**
 * Example 1: Basic Usage
 * Sử dụng cơ bản với giá trị mặc định
 */
export const BasicExample = () => {
  return <FarmerProcessScreen />;
};

/**
 * Example 2: Early Growth Stage
 * Giai đoạn sinh trưởng sớm
 */
export const EarlyGrowthExample = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Gieo hạt',
      description: 'Gieo hạt vào khay ươm',
      completed: true,
      dueDate: new Date(),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn gieo hạt:\n\n1. Chuẩn bị khay ươm sạch\n2. Đổ đất ươm đã khử trùng\n3. Gieo hạt cách nhau 2-3cm\n4. Phủ lớp đất mỏng\n5. Tưới nước nhẹ',
      },
    },
    {
      id: '2',
      title: 'Tưới nước',
      description: 'Tưới nước 2 lần/ngày',
      completed: false,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      hasGuide: false,
    },
  ];

  return (
    <FarmerProcessScreen
      farmerName="Anh Minh"
      farmName="Farm Lab Mekong"
      currentDay={5}
      totalDays={90}
      growthStage="Nảy mầm"
      tasks={tasks}
    />
  );
};

/**
 * Example 3: Flowering Stage
 * Giai đoạn ra hoa
 */
export const FloweringStageExample = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Bón phân Kali',
      description: 'Bón phân Kali để hoa phát triển tốt',
      completed: false,
      dueDate: new Date(),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn bón phân Kali:\n\n1. Sử dụng phân NPK 10-10-30\n2. Bón 50g/cây\n3. Bón cách gốc 20cm\n4. Tưới nước sau khi bón',
      },
    },
    {
      id: '2',
      title: 'Kiểm tra hoa',
      description: 'Kiểm tra hoa có bị sâu bệnh không',
      completed: false,
      dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn kiểm tra hoa:\n\n1. Quan sát màu sắc hoa\n2. Kiểm tra có sâu đục không\n3. Xem hoa có rụng bất thường\n4. Chụp ảnh nếu có vấn đề',
      },
    },
    {
      id: '3',
      title: 'Tỉa hoa',
      description: 'Tỉa bớt hoa yếu để hoa khỏe phát triển tốt',
      completed: false,
      dueDate: new Date(Date.now() + 5 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn tỉa hoa:\n\n1. Chọn hoa khỏe, to\n2. Tỉa bỏ hoa nhỏ, yếu\n3. Giữ 2-3 hoa/cành\n4. Dùng kéo sạch, sắc',
      },
    },
  ];

  const diaryEntries: DiaryEntry[] = [
    {
      id: '1',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      taskTitle: 'Bón phân lá',
      photos: ['https://via.placeholder.com/150'],
      notes: 'Đã bón phân lá, hoa phát triển tốt',
    },
    {
      id: '2',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      taskTitle: 'Tưới nước',
      photos: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
      notes: 'Tưới nước đều, độ ẩm ổn định',
    },
  ];

  return (
    <FarmerProcessScreen
      farmerName="Chị Lan"
      farmName="Farm Lab Đồng Tháp"
      currentDay={45}
      totalDays={90}
      growthStage="Ra hoa"
      tasks={tasks}
      diaryEntries={diaryEntries}
    />
  );
};

/**
 * Example 4: Fruiting Stage
 * Giai đoạn đậu trái
 */
export const FruitingStageExample = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Kiểm tra trái',
      description: 'Kiểm tra trái có phát triển đều không',
      completed: true,
      dueDate: new Date(),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn kiểm tra trái:\n\n1. Quan sát kích thước trái\n2. Kiểm tra màu sắc\n3. Xem có sâu bệnh không\n4. Đo đường kính trái',
      },
    },
    {
      id: '2',
      title: 'Bón phân trái',
      description: 'Bón phân để trái phát triển tốt',
      completed: false,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn bón phân trái:\n\n1. Sử dụng phân NPK 15-15-15\n2. Bón 100g/cây\n3. Bón cách gốc 30cm\n4. Tưới nước sau khi bón',
      },
    },
    {
      id: '3',
      title: 'Tỉa trái',
      description: 'Tỉa bớt trái nhỏ để trái to phát triển tốt',
      completed: false,
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn tỉa trái:\n\n1. Chọn trái to, khỏe\n2. Tỉa bỏ trái nhỏ, dị dạng\n3. Giữ 3-4 trái/cành\n4. Dùng kéo sạch, sắc',
      },
    },
  ];

  const diaryEntries: DiaryEntry[] = [
    {
      id: '1',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      taskTitle: 'Kiểm tra trái',
      photos: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
      notes: 'Trái phát triển tốt, kích thước đều',
    },
    {
      id: '2',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      taskTitle: 'Bón phân trái',
      photos: ['https://via.placeholder.com/150'],
      notes: 'Đã bón phân, trái phát triển nhanh',
    },
    {
      id: '3',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      photos: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
      notes: 'Chụp ảnh theo dõi sự phát triển của trái',
    },
  ];

  return (
    <FarmerProcessScreen
      farmerName="Anh Bảy"
      farmName="Farm Lab Bưởi"
      currentDay={70}
      totalDays={90}
      growthStage="Đậu trái"
      tasks={tasks}
      diaryEntries={diaryEntries}
    />
  );
};

/**
 * Example 5: Harvest Stage
 * Giai đoạn thu hoạch
 */
export const HarvestStageExample = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Kiểm tra độ chín',
      description: 'Kiểm tra trái đã chín đủ chưa',
      completed: true,
      dueDate: new Date(),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn kiểm tra độ chín:\n\n1. Quan sát màu sắc vỏ\n2. Kiểm tra độ cứng\n3. Đo độ ngọt (Brix)\n4. Kiểm tra mùi thơm',
      },
    },
    {
      id: '2',
      title: 'Chuẩn bị thu hoạch',
      description: 'Chuẩn bị dụng cụ và nhân lực',
      completed: false,
      dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn chuẩn bị thu hoạch:\n\n1. Chuẩn bị kéo, thang\n2. Chuẩn bị thùng đựng\n3. Sắp xếp nhân lực\n4. Kiểm tra thời tiết',
      },
    },
    {
      id: '3',
      title: 'Thu hoạch',
      description: 'Thu hoạch trái cẩn thận',
      completed: false,
      dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn thu hoạch:\n\n1. Hái trái vào buổi sáng mát\n2. Dùng kéo cắt cuống\n3. Xếp trái cẩn thận\n4. Tránh va đập',
      },
    },
  ];

  const diaryEntries: DiaryEntry[] = [
    {
      id: '1',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      taskTitle: 'Kiểm tra độ chín',
      photos: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
      notes: 'Trái đã chín 80%, chuẩn bị thu hoạch',
    },
    {
      id: '2',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      taskTitle: 'Đo độ ngọt',
      photos: ['https://via.placeholder.com/150'],
      notes: 'Độ ngọt đạt 14 Brix, đạt chuẩn',
    },
    {
      id: '3',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      photos: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
      notes: 'Chụp ảnh trái trước khi thu hoạch',
    },
  ];

  return (
    <FarmerProcessScreen
      farmerName="Anh Tú"
      farmName="Farm Lab Xoài"
      currentDay={88}
      totalDays={90}
      growthStage="Thu hoạch"
      tasks={tasks}
      diaryEntries={diaryEntries}
    />
  );
};

/**
 * Example 6: With Callbacks
 * Với các callback handlers
 */
export const WithCallbacksExample = () => {
  const [completedTasks, setCompletedTasks] = React.useState<string[]>([]);
  const [photoCount, setPhotoCount] = React.useState(0);

  const handleTaskToggle = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
    console.log('Task toggled:', taskId);
  };

  const handlePhotoCapture = () => {
    setPhotoCount(prev => prev + 1);
    console.log('Photo captured, total:', photoCount + 1);
  };

  return (
    <div>
      <div style={{ padding: '16px', backgroundColor: '#f0f0f0', marginBottom: '16px' }}>
        <h3>Thống kê:</h3>
        <p>Công việc hoàn thành: {completedTasks.length}</p>
        <p>Ảnh đã chụp: {photoCount}</p>
      </div>
      
      <FarmerProcessScreen
        onTaskToggle={handleTaskToggle}
        onPhotoCapture={handlePhotoCapture}
      />
    </div>
  );
};

/**
 * Example 7: Empty State
 * Trạng thái không có dữ liệu
 */
export const EmptyStateExample = () => {
  return (
    <FarmerProcessScreen
      farmerName="Nông dân mới"
      farmName="Farm Lab mới"
      currentDay={1}
      totalDays={90}
      growthStage="Chuẩn bị"
      tasks={[]}
      diaryEntries={[]}
    />
  );
};

export default {
  BasicExample,
  EarlyGrowthExample,
  FloweringStageExample,
  FruitingStageExample,
  HarvestStageExample,
  WithCallbacksExample,
  EmptyStateExample,
};
