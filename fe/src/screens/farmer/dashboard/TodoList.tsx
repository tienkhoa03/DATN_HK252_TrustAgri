/**
 * TodoList — today's care-plan tasks on dashboard (FR-F09, NFR-U01)
 */

import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface TodoTask {
  id: string;
  title: string;
  dueTime?: string;
  completed: boolean;
}

export interface TodoListProps {
  tasks: TodoTask[];
  loading: boolean;
  onUpdateTask: (taskId: string) => void;
  onViewAll: () => void;
}

export const TodoList: React.FC<TodoListProps> = ({ tasks, loading, onUpdateTask, onViewAll }) => {
  const visible = tasks.slice(0, 5);

  return (
    <div style={{ margin: `${spacing.sm} ${spacing.md} 0` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text.Title size="small" style={{ margin: 0 }}>Công việc hôm nay</Text.Title>
        <button
          type="button"
          onClick={onViewAll}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.primary.zaloBlue, fontSize: fontSize.caption,
            fontWeight: fontWeight.medium, padding: `${spacing.xs} 0`,
            minHeight: 44,
          }}
        >
          Xem tất cả →
        </button>
      </div>

      {loading && (
        <div style={{ padding: spacing.md, textAlign: 'center' }}>
          <span style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>Đang tải…</span>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div style={{
          padding: spacing.md, textAlign: 'center',
          backgroundColor: colors.background.secondary, borderRadius: 8,
        }}>
          <span style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>
            Chưa có công việc nào cho hôm nay.
          </span>
        </div>
      )}

      {!loading && visible.map((task) => (
        <div
          key={task.id}
          style={{
            display: 'flex', alignItems: 'center', gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.background.primary,
            border: `1px solid ${colors.background.secondary}`,
            borderRadius: 8,
            marginBottom: spacing.xs,
          }}
        >
          {/* Checkbox (display-only) */}
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            border: `2px solid ${task.completed ? colors.primary.agriGreen : colors.background.secondary}`,
            backgroundColor: task.completed ? colors.primary.agriGreen : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {task.completed && (
              <span style={{ color: colors.text.inverse, fontSize: '12px', lineHeight: 1 }}>✓</span>
            )}
          </div>

          {/* Title + dueTime */}
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: fontSize.caption,
              color: task.completed ? colors.text.secondary : colors.text.primary,
              textDecoration: task.completed ? 'line-through' : 'none',
            }}>
              {task.title}
            </span>
            {task.dueTime && (
              <span style={{
                marginLeft: spacing.sm,
                fontSize: fontSize.small,
                color: colors.text.secondary,
                backgroundColor: colors.background.secondary,
                padding: `1px ${spacing.xs}`,
                borderRadius: 4,
              }}>
                {task.dueTime}
              </span>
            )}
          </div>

          {/* Update button */}
          {!task.completed && (
            <button
              type="button"
              onClick={() => onUpdateTask(task.id)}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.primary.zaloBlue,
                color: colors.text.inverse,
                border: 'none',
                borderRadius: 6,
                fontSize: fontSize.small,
                fontWeight: fontWeight.medium,
                cursor: 'pointer',
                minHeight: 44,
                minWidth: 88,
                flexShrink: 0,
              }}
            >
              Cập nhật
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default TodoList;
