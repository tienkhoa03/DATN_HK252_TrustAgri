/**
 * Farmer Process & Diary Screen Demo
 * Interactive demo for the Farmer Process Screen
 */

import React, { useState } from 'react';
import { Page } from 'zmp-ui';
import { FarmerProcessScreen, Task, DiaryEntry } from './FarmerProcessScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface FarmerProcessScreenDemoProps {
  onBack?: () => void;
}

export const FarmerProcessScreenDemo: React.FC<FarmerProcessScreenDemoProps> = ({ onBack }) => {
  // Tên cứng theo yêu cầu
  const farmerName = 'Tiến Khoa';
  const farmName = 'Sầu riêng Monthong';

  // State for demo controls
  const [currentDay, setCurrentDay] = useState(15);
  const [totalDays] = useState(90);
  const [growthStage, setGrowthStage] = useState('Ra hoa');
  const [logs, setLogs] = useState<string[]>([]);

  // Mock tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Tưới nước buổi sáng',
      description: 'Tưới đều 20 lít/cây, tránh úng rễ',
      completed: true,
      dueDate: new Date(),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn tưới nước:\n\n1. Kiểm tra độ ẩm đất trước khi tưới\n2. Tưới đều xung quanh gốc cây\n3. Tránh tưới vào lúc trời nắng gắt\n4. Đảm bảo nước thoát tốt, không úng\n\nLưu ý: Giai đoạn ra hoa cần giữ độ ẩm ổn định 60-70%',
        videoUrl: 'https://example.com/watering-guide.mp4',
      },
    },
    {
      id: '2',
      title: 'Bón phân lá',
      description: 'Phun phân lá NPK 20-20-20, pha loãng 2g/lít',
      completed: false,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn bón phân lá:\n\n1. Pha phân NPK 20-20-20 với tỷ lệ 2g/1 lít nước\n2. Phun đều vào mặt dưới lá\n3. Thực hiện vào buổi chiều mát\n4. Tránh phun khi trời mưa\n\nLưu ý: Giai đoạn ra hoa cần bổ sung Kali để hoa phát triển tốt',
      },
    },
    {
      id: '3',
      title: 'Kiểm tra sâu bệnh',
      description: 'Quan sát lá, thân, hoa để phát hiện sâu bệnh sớm',
      completed: false,
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      hasGuide: true,
      guideContent: {
        text: 'Hướng dẫn kiểm tra sâu bệnh:\n\n1. Quan sát mặt trên và dưới lá\n2. Kiểm tra thân cây có vết lạ\n3. Xem hoa có bị sâu đục không\n4. Chụp ảnh nếu phát hiện bất thường\n\nDấu hiệu cần chú ý:\n- Lá vàng, héo\n- Có vết đục, lỗ trên lá\n- Hoa bị rụng bất thường\n- Có côn trùng lạ',
      },
    },
    {
      id: '4',
      title: 'Ghi nhận nhiệt độ và độ ẩm',
      description: 'Kiểm tra và ghi lại các chỉ số môi trường',
      completed: false,
      dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      hasGuide: false,
    },
  ]);

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([
    {
      id: '1',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      taskId: '1',
      taskTitle: 'Tưới nước buổi sáng',
      photos: ['https://via.placeholder.com/150'],
      notes: 'Đã tưới đủ nước, cây phát triển tốt',
    },
  ]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  // Demo control handlers
  const handleAdvanceDay = () => {
    if (currentDay < totalDays) {
      setCurrentDay(prev => prev + 1);
      addLog(`Tiến độ: Ngày ${currentDay + 1}/${totalDays}`);
      
      // Update growth stage based on day
      if (currentDay + 1 >= 60) {
        setGrowthStage('Đậu trái');
      } else if (currentDay + 1 >= 30) {
        setGrowthStage('Ra hoa');
      } else {
        setGrowthStage('Sinh trưởng');
      }
    }
  };

  const handleResetProgress = () => {
    setCurrentDay(1);
    setGrowthStage('Sinh trưởng');
    addLog('Đã reset tiến độ về ngày 1');
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Công việc mới',
      description: 'Mô tả công việc',
      completed: false,
      dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000),
      hasGuide: false,
    };
    setTasks(prev => [...prev, newTask]);
    addLog(`Đã thêm công việc: ${newTask.title}`);
  };

  const handleCompleteAllTasks = () => {
    setTasks(prev => prev.map(task => ({ ...task, completed: true })));
    addLog('Đã hoàn thành tất cả công việc');
  };

  const handleTaskToggle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      addLog(`${task.completed ? 'Bỏ hoàn thành' : 'Hoàn thành'}: ${task.title}`);
    }
  };

  const handlePhotoCapture = () => {
    addLog('Đã chụp ảnh cây trồng và thêm vào nhật ký');
  };

  // Styles
  const backBarStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '48px',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.tertiary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${spacing.md}`,
    zIndex: 1001,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const backButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'transparent',
    color: colors.text.primary,
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const demoControlsStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.secondary,
    borderTop: `2px solid ${colors.background.tertiary}`,
    padding: spacing.md,
    zIndex: 1000,
    maxHeight: '40vh',
    overflowY: 'auto',
  };

  const controlButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  };

  const contentWrapperStyles: React.CSSProperties = {
    marginTop: '48px',
    marginBottom: '40vh', // Space for demo controls
  };

  return (
    <Page className="farmer-process-demo">
      {/* Back Bar */}
      {onBack && (
        <div style={backBarStyles}>
          <button
            style={backButtonStyles}
            onClick={onBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Quay về màn hình chính"
          >
            ← Quay về
          </button>
        </div>
      )}

      {/* Farmer Process Screen */}
      <div style={contentWrapperStyles}>
        <FarmerProcessScreen
          farmerName={farmerName}
          farmName={farmName}
          currentDay={currentDay}
          totalDays={totalDays}
          growthStage={growthStage}
          tasks={tasks}
          diaryEntries={diaryEntries}
          onTaskToggle={handleTaskToggle}
          onPhotoCapture={handlePhotoCapture}
        />
      </div>

      {/* Demo Controls */}
      <div style={demoControlsStyles}>
        <h3 style={{ 
          margin: `0 0 ${spacing.md} 0`, 
          fontSize: fontSize.body, 
          fontWeight: fontWeight.semibold,
          color: colors.text.primary,
        }}>
          🎮 Demo Controls
        </h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: spacing.md }}>
          <button
            style={controlButtonStyles}
            onClick={handleAdvanceDay}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            ⏭️ Tiến 1 ngày
          </button>
          
          <button
            style={controlButtonStyles}
            onClick={handleResetProgress}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            🔄 Reset tiến độ
          </button>
          
          <button
            style={controlButtonStyles}
            onClick={handleAddTask}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            ➕ Thêm công việc
          </button>
          
          <button
            style={controlButtonStyles}
            onClick={handleCompleteAllTasks}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            ✅ Hoàn thành tất cả
          </button>
        </div>

        {/* Activity Log */}
        {logs.length > 0 && (
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.background.primary,
            borderRadius: '6px',
            maxHeight: '120px',
            overflowY: 'auto',
          }}>
            <h4 style={{ 
              margin: `0 0 ${spacing.sm} 0`, 
              fontSize: fontSize.caption, 
              fontWeight: fontWeight.semibold,
              color: colors.text.primary,
            }}>
              📋 Nhật ký hoạt động:
            </h4>
            {logs.map((log, index) => (
              <div 
                key={index} 
                style={{ 
                  fontSize: fontSize.small, 
                  color: colors.text.secondary, 
                  padding: `${spacing.xs} 0`,
                  borderBottom: index < logs.length - 1 ? `1px solid ${colors.background.secondary}` : 'none',
                }}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
};

export default FarmerProcessScreenDemo;
