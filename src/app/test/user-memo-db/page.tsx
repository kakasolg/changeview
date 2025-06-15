'use client';
import React, { useState } from 'react';

export default function UserMemoDbTestPage() {
  const [username, setUsername] = useState('test');
  const [password, setPassword] = useState('bere625');
  const [hexagramNumber, setHexagramNumber] = useState('');
  const [keywords, setKeywords] = useState('');
  const [memo, setMemo] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');

  // 삭제 확인 모달 상태
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const saveMemo = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        username,
        password,
        date: new Date().toISOString(),
        hexagramNumber: Number(hexagramNumber),
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        memo: memo.trim()
      };
      const res = await fetch('/api/test/user-memo-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setResult('저장 성공!');
        setHexagramNumber('');
        setKeywords('');
        setMemo('');
        fetchMemos();
      } else {
        setResult('저장 실패: ' + (data.message || '오류'));
      }
    } catch (e) {
      setResult('저장 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const fetchMemos = async (pageNum = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/test/user-memo-db?page=${pageNum}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.success) {
        setMemos(data.memos);
        setTotal(data.total);
        setPage(data.page);
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id: string, memo: string) => {
    setEditId(id);
    setEditMemo(memo);
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditMemo('');
  };
  const saveEdit = async () => {
    if (!editId || !editMemo.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        id: editId,
        username,
        password,
        memo: editMemo.trim()
      };
      const res = await fetch('/api/test/user-memo-db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setResult('수정 성공!');
        cancelEdit();
        fetchMemos(page);
      } else {
        setResult('수정 실패: ' + (data.message || '오류'));
      }
    } catch {
      setResult('수정 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const cancelDelete = () => {
    setDeleteId(null);
    setShowDeleteModal(false);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    setShowDeleteModal(false);
    await deleteMemo(deleteId);
    setDeleteId(null);
  };

  const deleteMemo = async (id: string) => {
    setLoading(true);
    setResult(null);
    try {
      const payload = { id, username, password };
      const res = await fetch('/api/test/user-memo-db', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setResult('삭제 성공!');
        fetchMemos(page);
      } else {
        setResult('삭제 실패: ' + (data.message || '오류'));
      }
    } catch {
      setResult('삭제 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMemos(page);
    // eslint-disable-next-line
  }, [page]);

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">📝 사용자 메모 MongoDB 저장 테스트</h1>
      <div className="mb-4 flex gap-2">
        <input
          className="border p-2 w-28"
          placeholder="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="border p-2 w-36"
          placeholder="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <input
          className="border p-2 mr-2 w-24"
          placeholder="괘 번호"
          type="number"
          value={hexagramNumber}
          onChange={e => setHexagramNumber(e.target.value)}
        />
        <input
          className="border p-2 mr-2 w-48"
          placeholder="키워드(,로 구분)"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
        />
      </div>
      <textarea
        className="border p-2 w-full mb-2"
        rows={3}
        placeholder="메모 내용"
        value={memo}
        onChange={e => setMemo(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={saveMemo}
        disabled={loading || !hexagramNumber || !memo.trim()}
      >
        {loading ? '저장 중...' : '메모 저장'}
      </button>
      {result && <div className="mt-2 text-sm text-green-700">{result}</div>}
      <hr className="my-6" />
      <h2 className="text-lg font-semibold mb-2">최근 저장된 메모</h2>
      <ul className="space-y-2">
        {memos.map((m, i) => (
          <li key={m._id || i} className="bg-gray-100 p-2 rounded">
            <div className="text-xs text-gray-500">{m.date ? new Date(m.date).toLocaleString() : ''}</div>
            <div>user: {m.username || '-'} / 괘 번호: {m.hexagramNumber} / 키워드: {Array.isArray(m.keywords) ? m.keywords.join(', ') : ''}</div>
            {editId === m._id ? (
              <div className="mt-1">
                <textarea
                  className="border p-2 w-full mb-1"
                  rows={2}
                  value={editMemo}
                  onChange={e => setEditMemo(e.target.value)}
                />
                <button className="bg-green-600 text-white px-2 py-1 rounded mr-2" onClick={saveEdit} disabled={loading || !editMemo.trim()}>저장</button>
                <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={cancelEdit}>취소</button>
              </div>
            ) : (
              <>
                <div className="text-gray-800 mt-1">{m.memo}</div>
                <button className="mt-1 text-xs text-blue-700 underline mr-2" onClick={() => startEdit(m._id, m.memo)}>수정</button>
                <button className="mt-1 text-xs text-red-700 underline" onClick={() => requestDelete(m._id)}>삭제</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {/* 페이징 */}
      <div className="flex gap-2 mt-4">
        <button className="px-2 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>이전</button>
        <span className="px-2">{page} / {Math.ceil(total / pageSize)}</span>
        <button className="px-2 py-1 border rounded" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total}>다음</button>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-xs w-full">
            <div className="mb-4 text-gray-800 font-semibold">정말 삭제하시겠습니까?</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-1 rounded bg-gray-300" onClick={cancelDelete}>취소</button>
              <button className="px-4 py-1 rounded bg-red-600 text-white" onClick={confirmDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
