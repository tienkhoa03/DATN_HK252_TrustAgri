/**
 * Mock for zmp-ui library
 * Used in tests to avoid ESM import issues
 */

import React from 'react';

export const Icon = ({ icon, size, style, className, ...props }: any) => {
  return React.createElement('span', {
    'data-testid': 'zmp-icon',
    'data-icon': icon,
    'data-size': size,
    className,
    style,
    ...props,
  });
};

export const App = ({ children }: any) => {
  return React.createElement('div', { 'data-testid': 'zmp-app' }, children);
};

export const Page = ({ children, className, ...props }: any) => {
  return React.createElement('div', { 'data-testid': 'zmp-page', className, ...props }, children);
};

export const Box = ({ children, className, ...props }: any) => {
  return React.createElement('div', { 'data-testid': 'zmp-box', className, ...props }, children);
};

export const Button = ({ children, onClick, className, fullWidth, ...props }: any) => {
  return React.createElement('button', { 
    'data-testid': 'zmp-button', 
    onClick, 
    className, 
    ...props 
  }, children);
};

const TextTitle = ({ children, size, className, style, ...props }: any) => {
  return React.createElement('h2', { 
    'data-testid': 'zmp-text-title', 
    className, 
    style,
    ...props 
  }, children);
};

export const Text = Object.assign(
  ({ children, size, className, style, ...props }: any) => {
    return React.createElement('p', { 
      'data-testid': 'zmp-text', 
      className, 
      style,
      ...props 
    }, children);
  },
  { Title: TextTitle }
);

export const Modal = ({ visible, title, onClose, children, actions, ...props }: any) => {
  if (!visible) return null;
  return React.createElement('div', { 
    'data-testid': 'zmp-modal',
    role: 'dialog',
    ...props 
  }, [
    React.createElement('div', { key: 'title' }, title),
    React.createElement('div', { key: 'content' }, children),
    actions && React.createElement('div', { key: 'actions' }, 
      actions.map((action: any, index: number) => 
        React.createElement('button', { 
          key: index, 
          onClick: action.onClick 
        }, action.text)
      )
    ),
  ]);
};

export default {
  Icon,
  App,
  Page,
  Box,
  Button,
  Text,
  Modal,
};
