/**
 * React Hook for Error Handling
 * Provides error handling utilities for React components
 * 
 * Requirements: 8.1-8.5
 */

import { useState, useCallback, useEffect } from 'react';
import {
  DesignSystemError,
  DesignSystemErrorType,
  errorRecoveryManager,
  errorLogger,
  handleColorValidation,
  handleTypographyValidation,
  handleIconValidation,
  handleAssetLoading,
  handleFontLoading,
} from './errorHandling';

/**
 * Error state interface
 */
export interface ErrorState {
  hasError: boolean;
  error?: DesignSystemError;
  recovered: boolean;
  recoveryValue?: any;
}

/**
 * Hook for handling design system errors in components
 */
export function useErrorHandling() {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    recovered: false,
  });

  /**
   * Handle error with automatic recovery
   */
  const handleError = useCallback((error: DesignSystemError) => {
    const isRecoverable = errorRecoveryManager.isRecoverable(error);
    let recoveryValue: any = undefined;

    if (isRecoverable) {
      recoveryValue = errorRecoveryManager.recover(error);
      errorLogger.log(error, true, recoveryValue);
    } else {
      errorLogger.log(error, false);
    }

    setErrorState({
      hasError: true,
      error,
      recovered: isRecoverable,
      recoveryValue,
    });

    return { recovered: isRecoverable, value: recoveryValue };
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      recovered: false,
    });
  }, []);

  /**
   * Safe color validation
   */
  const safeColor = useCallback((color: string, fallback: string = '#000000') => {
    const result = handleColorValidation(color, fallback);
    if (result.error) {
      handleError(result.error);
    }
    return result.color;
  }, [handleError]);

  /**
   * Safe typography validation
   */
  const safeFontSize = useCallback((fontSize: string, fallback: string = '16px') => {
    const result = handleTypographyValidation(fontSize, fallback);
    if (result.error) {
      handleError(result.error);
    }
    return result.fontSize;
  }, [handleError]);

  /**
   * Safe icon validation
   */
  const safeIcon = useCallback((iconName: string, requireOutline: boolean = true) => {
    const result = handleIconValidation(iconName, requireOutline);
    if (result.error) {
      handleError(result.error);
    }
    return result.iconName;
  }, [handleError]);

  /**
   * Safe asset loading
   */
  const safeAsset = useCallback((
    assetUrl: string,
    assetType: 'image' | 'icon' | 'font' | 'other',
    fallbackUrl?: string
  ) => {
    const result = handleAssetLoading(assetUrl, assetType, fallbackUrl);
    if (result.error) {
      handleError(result.error);
    }
    return result.url;
  }, [handleError]);

  return {
    errorState,
    handleError,
    clearError,
    safeColor,
    safeFontSize,
    safeIcon,
    safeAsset,
  };
}

/**
 * Hook for image loading with error handling
 */
export function useImageLoading(src: string, fallbackSrc?: string) {
  const [imageState, setImageState] = useState<{
    src: string;
    loading: boolean;
    error: boolean;
  }>({
    src,
    loading: true,
    error: false,
  });

  useEffect(() => {
    setImageState({ src, loading: true, error: false });

    const img = new Image();
    
    img.onload = () => {
      setImageState({ src, loading: false, error: false });
    };

    img.onerror = () => {
      const result = handleAssetLoading(src, 'image', fallbackSrc);
      errorLogger.log(result.error!, true, result.url);
      
      setImageState({
        src: result.url,
        loading: false,
        error: true,
      });
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);

  return imageState;
}

/**
 * Hook for font loading with error handling
 */
export function useFontLoading(fontFamily: string, fallbackFonts: string[] = ['sans-serif']) {
  const [fontState, setFontState] = useState<{
    fontFamily: string;
    loading: boolean;
    error: boolean;
  }>({
    fontFamily,
    loading: true,
    error: false,
  });

  useEffect(() => {
    // Check if Font Loading API is available
    if (!('fonts' in document)) {
      // Fallback for browsers without Font Loading API
      const result = handleFontLoading(fontFamily, fallbackFonts);
      setFontState({
        fontFamily: result.fontFamily,
        loading: false,
        error: false,
      });
      return;
    }

    setFontState({ fontFamily, loading: true, error: false });

    // Try to load the font
    (document as any).fonts.load(`16px ${fontFamily}`).then(
      () => {
        setFontState({ fontFamily, loading: false, error: false });
      },
      () => {
        const result = handleFontLoading(fontFamily, fallbackFonts);
        errorLogger.log(result.error!, true, result.fontFamily);
        
        setFontState({
          fontFamily: result.fontFamily,
          loading: false,
          error: true,
        });
      }
    );
  }, [fontFamily, fallbackFonts]);

  return fontState;
}

/**
 * Hook for monitoring error logs
 */
export function useErrorLogs(filterType?: DesignSystemErrorType) {
  const [logs, setLogs] = useState(() => 
    filterType 
      ? errorLogger.getLogsByType(filterType)
      : errorLogger.getLogs()
  );

  useEffect(() => {
    // Update logs periodically
    const interval = setInterval(() => {
      setLogs(
        filterType
          ? errorLogger.getLogsByType(filterType)
          : errorLogger.getLogs()
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [filterType]);

  return logs;
}

/**
 * Export all hooks
 */
export default {
  useErrorHandling,
  useImageLoading,
  useFontLoading,
  useErrorLogs,
};
