import { Menu, shell, BrowserWindow, dialog, app } from 'electron';

function sendAction(action: string, payload?: unknown): void {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send('menu:action', action, payload);
  }
}

/**
 * Builds the complete professional desktop menu bar for Afro Vision AI Studio
 * with all 9 standard professional menus (File, Edit, View, Photo, Develop, Mask, AI Studio, Window, Help).
 */
export function setupAppMenu(): void {
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    // 1. FILE
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project / Catalogue...',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendAction('file:new-project')
        },
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendAction('file:open-project')
        },
        {
          label: 'Open Recent Project',
          submenu: [
            {
              label: 'Studio Session 2026',
              click: () => sendAction('file:open-recent', 'proj_default')
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Import Photographs...',
          accelerator: 'CmdOrCtrl+I',
          click: () => sendAction('file:import-photos')
        },
        {
          label: 'Import Folder...',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => sendAction('file:import-folder')
        },
        {
          label: 'Load Sample Portrait Set',
          click: () => sendAction('file:load-samples')
        },
        { type: 'separator' },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendAction('file:save-project')
        },
        {
          label: 'Save Project As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendAction('file:save-project-as')
        },
        { type: 'separator' },
        {
          label: 'Export Current Image...',
          accelerator: 'CmdOrCtrl+E',
          click: () => sendAction('file:export-current')
        },
        {
          label: 'Export Selected Images...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => sendAction('file:export-selected')
        },
        {
          label: 'Batch Export...',
          click: () => sendAction('file:batch-export')
        },
        { type: 'separator' },
        {
          label: 'Backup Catalogue Database...',
          click: () => sendAction('file:backup-project')
        },
        {
          label: 'Restore Catalogue Database...',
          click: () => sendAction('file:restore-project')
        },
        { type: 'separator' },
        { role: 'close', label: 'Close Project' },
        { role: 'quit', label: 'Exit Afro Vision AI Studio' }
      ]
    },

    // 2. EDIT
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => sendAction('edit:undo')
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          click: () => sendAction('edit:redo')
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Copy Edit Settings',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => sendAction('edit:copy-settings')
        },
        {
          label: 'Paste Edit Settings',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: () => sendAction('edit:paste-settings')
        },
        {
          label: 'Reset Current Edit',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => sendAction('edit:reset-adjustments')
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => sendAction('edit:select-all')
        },
        {
          label: 'Deselect All',
          accelerator: 'CmdOrCtrl+D',
          click: () => sendAction('edit:deselect-all')
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => sendAction('edit:preferences')
        },
        {
          label: 'Keyboard Shortcuts Reference',
          accelerator: 'CmdOrCtrl+/',
          click: () => sendAction('help:shortcuts')
        }
      ]
    },

    // 3. VIEW
    {
      label: 'View',
      submenu: [
        {
          label: 'Library View',
          accelerator: 'G',
          click: () => sendAction('view:library')
        },
        {
          label: 'Develop View',
          accelerator: 'D',
          click: () => sendAction('view:develop')
        },
        {
          label: 'AI Studio Workspace',
          accelerator: 'A',
          click: () => sendAction('view:ai-studio')
        },
        { type: 'separator' },
        {
          label: 'Grid View',
          click: () => sendAction('view:grid')
        },
        {
          label: 'Loupe View',
          accelerator: 'E',
          click: () => sendAction('view:loupe')
        },
        {
          label: 'Compare / Split View',
          accelerator: 'C',
          click: () => sendAction('view:split')
        },
        {
          label: 'Toggle Before and After',
          accelerator: '\\',
          click: () => sendAction('view:toggle-split')
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => sendAction('view:zoom-in')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => sendAction('view:zoom-out')
        },
        {
          label: 'Fit to Screen',
          accelerator: 'CmdOrCtrl+0',
          click: () => sendAction('view:zoom-fit')
        },
        {
          label: 'Actual Size (100%)',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendAction('view:zoom-100')
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'Show or Hide Side Panels',
          accelerator: 'Tab',
          click: () => sendAction('view:toggle-panels')
        },
        {
          label: 'Show or Hide Filmstrip',
          accelerator: 'F6',
          click: () => sendAction('view:toggle-filmstrip')
        },
        {
          label: 'Reset Workspace Layout',
          click: () => sendAction('view:reset-workspace')
        },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },

    // 4. PHOTO
    {
      label: 'Photo',
      submenu: [
        {
          label: 'Rotate 90° Left',
          accelerator: 'CmdOrCtrl+[',
          click: () => sendAction('photo:rotate-ccw')
        },
        {
          label: 'Rotate 90° Right',
          accelerator: 'CmdOrCtrl+]',
          click: () => sendAction('photo:rotate-cw')
        },
        {
          label: 'Flip Horizontal',
          click: () => sendAction('photo:flip-h')
        },
        {
          label: 'Flip Vertical',
          click: () => sendAction('photo:flip-v')
        },
        { type: 'separator' },
        {
          label: 'Flag: Pick',
          accelerator: 'P',
          click: () => sendAction('photo:flag-pick')
        },
        {
          label: 'Flag: Reject',
          accelerator: 'X',
          click: () => sendAction('photo:flag-reject')
        },
        {
          label: 'Clear Flag',
          accelerator: 'U',
          click: () => sendAction('photo:flag-unflag')
        },
        {
          label: 'Toggle Favorite',
          accelerator: 'F',
          click: () => sendAction('photo:toggle-fav')
        },
        { type: 'separator' },
        {
          label: 'Rating: ★★★★★ (5)',
          accelerator: '5',
          click: () => sendAction('photo:rate-5')
        },
        {
          label: 'Rating: ★★★★☆ (4)',
          accelerator: '4',
          click: () => sendAction('photo:rate-4')
        },
        {
          label: 'Rating: ★★★☆☆ (3)',
          accelerator: '3',
          click: () => sendAction('photo:rate-3')
        },
        {
          label: 'Rating: ★★☆☆☆ (2)',
          accelerator: '2',
          click: () => sendAction('photo:rate-2')
        },
        {
          label: 'Rating: ★☆☆☆☆ (1)',
          accelerator: '1',
          click: () => sendAction('photo:rate-1')
        },
        {
          label: 'Clear Rating (0)',
          accelerator: '0',
          click: () => sendAction('photo:rate-0')
        },
        { type: 'separator' },
        {
          label: 'Create Virtual Copy',
          accelerator: "CmdOrCtrl+'",
          click: () => sendAction('photo:virtual-copy')
        },
        {
          label: 'Synchronise Settings...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendAction('edit:paste-settings')
        },
        {
          label: 'Auto AI Enhance Photo',
          accelerator: 'CmdOrCtrl+Alt+A',
          click: () => sendAction('photo:ai-enhance')
        }
      ]
    },

    // 5. DEVELOP
    {
      label: 'Develop',
      submenu: [
        {
          label: 'Auto Tone & Exposure',
          accelerator: 'CmdOrCtrl+U',
          click: () => sendAction('develop:auto-ai')
        },
        { type: 'separator' },
        {
          label: 'Tone Curve Adjustment',
          click: () => sendAction('develop:tone-curve')
        },
        {
          label: 'Colour Mixer & HSL',
          click: () => sendAction('develop:color-mixer')
        },
        {
          label: 'Colour Grading',
          click: () => sendAction('develop:color-grading')
        },
        {
          label: 'Detail & Sharpening',
          click: () => sendAction('develop:detail')
        },
        {
          label: 'Lens Corrections',
          click: () => sendAction('develop:lens')
        },
        { type: 'separator' },
        {
          label: 'Melanin Studio: Golden Glow',
          click: () => sendAction('develop:preset', 'builtin_melanin_golden_glow')
        },
        {
          label: 'Melanin Studio: Warm Radiance',
          click: () => sendAction('develop:preset', 'builtin_melanin_warm_radiance')
        },
        {
          label: 'Melanin Studio: Rich Ebony',
          click: () => sendAction('develop:preset', 'builtin_melanin_rich_ebony')
        },
        {
          label: 'Studio High Key',
          click: () => sendAction('develop:preset', 'builtin_studio_high_key')
        },
        {
          label: 'Midnight Bronze',
          click: () => sendAction('develop:preset', 'builtin_midnight_bronze')
        },
        { type: 'separator' },
        {
          label: 'Reset All Adjustments',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => sendAction('edit:reset-adjustments')
        }
      ]
    },

    // 6. MASK
    {
      label: 'Mask',
      submenu: [
        {
          label: 'Select Subject',
          click: () => sendAction('mask:select-subject')
        },
        {
          label: 'Select Sky',
          click: () => sendAction('mask:select-sky')
        },
        {
          label: 'Select Background',
          click: () => sendAction('mask:select-background')
        },
        {
          label: 'Select People (Portrait)',
          click: () => sendAction('mask:select-people')
        },
        { type: 'separator' },
        {
          label: 'Brush Tool',
          accelerator: 'K',
          click: () => sendAction('mask:brush')
        },
        {
          label: 'Linear Gradient',
          accelerator: 'M',
          click: () => sendAction('mask:linear')
        },
        {
          label: 'Radial Gradient',
          accelerator: 'Shift+M',
          click: () => sendAction('mask:radial')
        },
        {
          label: 'Colour Range Mask',
          click: () => sendAction('mask:color-range')
        },
        {
          label: 'Luminance Range Mask',
          click: () => sendAction('mask:luminance-range')
        },
        { type: 'separator' },
        {
          label: 'Invert Active Mask',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => sendAction('mask:invert')
        }
      ]
    },

    // 7. AI STUDIO
    {
      label: 'AI Studio',
      submenu: [
        {
          label: 'AI Natural-Language Assistant...',
          click: () => sendAction('ai:assistant')
        },
        {
          label: 'Automatic Intelligent Enhancement',
          accelerator: 'CmdOrCtrl+Alt+A',
          click: () => sendAction('photo:ai-enhance')
        },
        { type: 'separator' },
        {
          label: 'Generative Object Removal (Inpainting)',
          click: () => sendAction('ai:object-removal')
        },
        {
          label: 'AI Background Removal',
          click: () => sendAction('ai:background-removal')
        },
        {
          label: 'AI Background Replacement',
          click: () => sendAction('ai:background-replace')
        },
        {
          label: 'Melanin Portrait Retouching & Glow',
          click: () => sendAction('ai:portrait-retouch')
        },
        {
          label: 'AI Detail Denoise',
          click: () => sendAction('ai:denoise')
        },
        {
          label: 'AI Super-Resolution Upscaling',
          click: () => sendAction('ai:upscale')
        },
        { type: 'separator' },
        {
          label: 'Batch AI Auto-Correct Selected Photos',
          click: () => sendAction('ai:batch-correct')
        },
        {
          label: 'AI Model Settings & Offline Models...',
          click: () => sendAction('ai:settings')
        }
      ]
    },

    // 8. WINDOW
    {
      label: 'Window',
      submenu: [
        {
          label: 'Library Workspace',
          click: () => sendAction('view:library')
        },
        {
          label: 'Editor / Develop Workspace',
          click: () => sendAction('view:develop')
        },
        {
          label: 'AI Studio Workspace',
          click: () => sendAction('view:ai-studio')
        },
        {
          label: 'Batch Processing Queue',
          click: () => sendAction('view:batch')
        },
        {
          label: 'Export Queue & Manager',
          click: () => sendAction('file:export-selected')
        },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'reload' },
        {
          label: 'Reset Workspace Layout',
          click: () => sendAction('view:reset-workspace')
        }
      ]
    },

    // 9. HELP
    {
      label: 'Help',
      submenu: [
        {
          label: 'User Guide & Documentation',
          click: async () => {
            await shell.openExternal('https://www.afrovisionmedia.co.za/docs');
          }
        },
        {
          label: 'Afro Vision Media Website',
          click: async () => {
            await shell.openExternal('https://www.afrovisionmedia.co.za');
          }
        },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/ademlitrik');
          }
        },
        { type: 'separator' },
        {
          label: 'Keyboard Shortcuts Reference',
          accelerator: 'CmdOrCtrl+/',
          click: () => sendAction('help:shortcuts')
        },
        {
          label: 'System Diagnostics & Telemetry',
          click: () => sendAction('help:diagnostics')
        },
        { type: 'separator' },
        {
          label: 'About Afro Vision AI Studio',
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About Afro Vision AI Studio',
              message: 'Afro Vision AI Studio v1.0.0',
              detail:
                'AI-Powered Batch Photo Correction & Professional Photo Editing.\n\n' +
                'Developed by: Tanyaradzwa Livingstone Bvute\n' +
                'Company: Afro Vision Media\n' +
                'Website: https://www.afrovisionmedia.co.za\n\n' +
                'Complete offline-first non-destructive engine with melanin-inclusive skin protection, full desktop menus, and high-performance image processing.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const appMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(appMenu);
}
