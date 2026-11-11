/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { EditorLayout } from './components/layout/EditorLayout';
import { useEditorStore } from './store/editorStore';
import { StorageService } from './services/storageService';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const { setProject, project } = useEditorStore();

  // On first load, check if user had a recent project
  useEffect(() => {
    async function initLatestProject() {
      try {
        const list = await StorageService.listProjects();
        if (list.length > 0) {
          // If project exists, keep dashboard ready with projects list
        }
      } catch (err) {
        console.warn('Initial project check failed', err);
      }
    }
    initLatestProject();
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0d0e14] text-white font-sans antialiased">
      {currentView === 'dashboard' ? (
        <ProjectDashboard onOpenEditor={() => setCurrentView('editor')} />
      ) : (
        <EditorLayout onOpenDashboard={() => setCurrentView('dashboard')} />
      )}
    </main>
  );
}
