import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

export function useKeyboardShortcuts() {
  const {
    togglePlay,
    undo,
    redo,
    deleteClip,
    selectedClipId,
    splitClip,
    duplicateClip,
    currentTime,
    setCurrentTime,
    saveProject,
    openExportModal,
    project,
    toggleMute
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox'
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if (cmdOrCtrl && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y
      if ((cmdOrCtrl && e.shiftKey && e.code === 'KeyZ') || (cmdOrCtrl && e.code === 'KeyY')) {
        e.preventDefault();
        redo();
        return;
      }

      // Save: Ctrl+S / Cmd+S
      if (cmdOrCtrl && e.code === 'KeyS') {
        e.preventDefault();
        saveProject();
        return;
      }

      // Export: Ctrl+E / Cmd+E
      if (cmdOrCtrl && e.code === 'KeyE') {
        e.preventDefault();
        openExportModal();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if (cmdOrCtrl && e.code === 'KeyD') {
        e.preventDefault();
        if (selectedClipId) {
          duplicateClip(selectedClipId);
        }
        return;
      }

      // Split clip: S
      if (e.code === 'KeyS' && !cmdOrCtrl) {
        e.preventDefault();
        if (selectedClipId) {
          splitClip(selectedClipId, currentTime);
        }
        return;
      }

      // Delete: Delete or Backspace
      if ((e.code === 'Delete' || e.code === 'Backspace') && !cmdOrCtrl) {
        e.preventDefault();
        if (selectedClipId) {
          deleteClip(selectedClipId);
        }
        return;
      }

      // Frame Step Left: ArrowLeft
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / 30;
        setCurrentTime(Math.max(0, currentTime - step));
        return;
      }

      // Frame Step Right: ArrowRight
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / 30;
        const maxDuration = project?.duration || 10;
        setCurrentTime(Math.min(maxDuration, currentTime + step));
        return;
      }

      // Home: Go to 0s
      if (e.code === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
        return;
      }

      // End: Go to project end
      if (e.code === 'End') {
        e.preventDefault();
        if (project) setCurrentTime(project.duration);
        return;
      }

      // Mute: KeyM
      if (e.code === 'KeyM' && !cmdOrCtrl) {
        e.preventDefault();
        toggleMute();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    undo,
    redo,
    deleteClip,
    selectedClipId,
    splitClip,
    duplicateClip,
    currentTime,
    setCurrentTime,
    saveProject,
    openExportModal,
    project,
    toggleMute
  ]);
}
