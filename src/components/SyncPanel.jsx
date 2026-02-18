import { useState, useRef } from 'react';
import { Card } from './Inputs';
import { exportStateJSON, importStateJSON } from '../state/persistence';
import { ACTIONS } from '../state/reducer';

export default function SyncPanel({ state, dispatch, onReset }) {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  function handleExport() {
    const json = exportStateJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `w2mp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportText() {
    try {
      setImportError('');
      setImportSuccess(false);
      const imported = importStateJSON(importText);
      dispatch({ type: ACTIONS.LOAD_STATE, state: imported });
      setImportSuccess(true);
      setImportText('');
    } catch (e) {
      setImportError('Invalid JSON: ' + e.message);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setImportError('');
        setImportSuccess(false);
        const imported = importStateJSON(ev.target.result);
        dispatch({ type: ACTIONS.LOAD_STATE, state: imported });
        setImportSuccess(true);
      } catch (err) {
        setImportError('Invalid file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <Card title="Sync and Export">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Export to JSON
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 border border-gray-700 rounded transition-colors"
          >
            Reset All
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-400">Import from File</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border file:border-gray-700 file:text-sm file:font-medium file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-400">Import from Text</div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste exported JSON here..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 font-mono focus:border-blue-500 focus:outline-none resize-none"
          />
          <button
            onClick={handleImportText}
            disabled={!importText.trim()}
            className="px-4 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>

        {importError && (
          <div className="text-sm text-red-400 p-2 bg-red-900/20 rounded">{importError}</div>
        )}
        {importSuccess && (
          <div className="text-sm text-green-400 p-2 bg-green-900/20 rounded">State imported successfully.</div>
        )}
      </div>
    </Card>
  );
}
