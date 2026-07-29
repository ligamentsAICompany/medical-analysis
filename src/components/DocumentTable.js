'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, BarChart2, Trash2, ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getDocumentAttachmentName } from './analysis/FeedbackAttachmentsPanel';

const PAGE_SIZE = 10;

const TYPE_COLORS = {
  'Lab Report':        { color: '#0369a1', bg: '#e0f2fe' },
  'Prescription':      { color: '#7c3aed', bg: '#ede9fe' },
  'Discharge Summary': { color: '#0f766e', bg: '#ccfbf1' },
  'Imaging Report':    { color: '#b45309', bg: '#fef3c7' },
  'Referral Letter':   { color: '#9a3412', bg: '#ffedd5' },
  'Consent Form':      { color: '#be185d', bg: '#fce7f3' },
  'Other':             { color: '#475569', bg: '#f1f5f9' },
};

const uploadDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatDate(iso) {
  return uploadDateFormatter.format(new Date(iso));
}

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS['Other'];
  return (
    <span className="type-badge" style={{ color: c.color, background: c.bg }}>{type || '—'}</span>
  );
}

function SortIcon({ field, sort }) {
  if (sort.field !== field) return <ChevronUp size={14} style={{ opacity: 0.3 }} />;
  return sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
}

export default function DocumentTable({ documents, onView, onAnalysis, onDelete, loading = false, isAdmin = false, onNewFinding, newFindingOpen = false }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState({ field: 'uploadedAt', dir: 'desc' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  const allTypes = useMemo(() => {
    const types = new Set(documents.map(d => d.analysis?.classification?.type).filter(Boolean));
    return ['all', ...types];
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(d => {
      const name = String(d?.name || '').toLowerCase();
      const attachmentName = String(getDocumentAttachmentName(d) || '').toLowerCase();
      const matchSearch = !q
        || name.includes(q)
        || attachmentName.includes(q)
        || (d.analysis?.patientName || '').toLowerCase().includes(q)
        || (d.analysis?.classification?.type || '').toLowerCase().includes(q)
        || (isAdmin && (d.createdBy || d.uploadedBy || '').toLowerCase().includes(q));
      const matchType = typeFilter === 'all' || d.analysis?.classification?.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [documents, search, typeFilter, isAdmin]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (sort.field === 'uploadedAt') { av = a.uploadedAt; bv = b.uploadedAt; }
      else if (sort.field === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (sort.field === 'attachment') {
        av = getDocumentAttachmentName(a).toLowerCase();
        bv = getDocumentAttachmentName(b).toLowerCase();
      }
      else if (sort.field === 'type') { av = a.analysis?.classification?.type || ''; bv = b.analysis?.classification?.type || ''; }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const colCount = isAdmin ? 8 : 7;

  const toggleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
    setPage(1);
  };

  return (
    <div className="doc-table-wrap">
      <div className="doc-table-toolbar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by report, attachment, type…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-chips">
          {allTypes.map(t => (
            <button
              key={t}
              className={`filter-chip${typeFilter === t ? ' filter-chip--active' : ''}`}
              onClick={() => { setTypeFilter(t); setPage(1); }}
            >
              {t === 'all' ? 'All types' : t}
            </button>
          ))}
        </div>
        <span className="doc-count">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
        {onNewFinding ? (
          <button
            type="button"
            className="shell-btn shell-btn--success doc-table-toolbar__new"
            onClick={onNewFinding}
            aria-pressed={newFindingOpen}
          >
            <Plus size={16} aria-hidden />
            New finding
          </button>
        ) : null}
      </div>

      <div className="table-scroll">
        <table className="doc-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-name sortable" onClick={() => toggleSort('name')}>
                Report <SortIcon field="name" sort={sort} />
              </th>
              <th className="col-type sortable" onClick={() => toggleSort('type')}>
                Document Type <SortIcon field="type" sort={sort} />
              </th>
              <th className="col-attachment sortable" onClick={() => toggleSort('attachment')}>
                Attachment <SortIcon field="attachment" sort={sort} />
              </th>
              {isAdmin ? (
                <th className="col-owner">Uploaded by</th>
              ) : null}
              <th className="col-date sortable" onClick={() => toggleSort('uploadedAt')}>
                Uploaded <SortIcon field="uploadedAt" sort={sort} />
              </th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan={colCount} className="table-empty">
                  <div className="table-empty-content">
                    <span style={{ fontSize: 32 }}>📂</span>
                    <p>
                      {loading
                        ? 'Loading your reports…'
                        : search || typeFilter !== 'all'
                          ? 'No documents match your filters.'
                          : isAdmin
                            ? 'No reports from any user yet.'
                            : 'No reports yet. Upload a file to get started.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {pageData.map((doc, i) => (
              <tr key={doc.id} className="doc-row">
                <td className="col-num text-muted">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="col-name">
                  <span className="filename" title={doc.name}>{doc.name}</span>
                </td>
                <td className="col-type">
                  {doc.analysis?.classification ? (
                    <TypeBadge type={doc.analysis.classification.type} />
                  ) : '—'}
                </td>
                <td className="col-attachment">
                  <span className="filename" title={getDocumentAttachmentName(doc)}>
                    {getDocumentAttachmentName(doc)}
                  </span>
                </td>
                {isAdmin ? (
                  <td className="col-owner">
                    {doc.createdBy || doc.uploadedBy || <span className="text-muted">—</span>}
                  </td>
                ) : null}
                <td className="col-date text-muted">{formatDate(doc.uploadedAt)}</td>
                <td className="col-status"><StatusBadge status={doc.status} /></td>
                <td className="col-actions">
                  <div className="action-btns">
                    <button
                      className="action-btn action-btn--view"
                      title="View PDF"
                      onClick={() => onView(doc)}
                      disabled={doc.status !== 'ready'}
                      aria-label="View PDF"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="action-btn action-btn--analysis"
                      title="View Analysis"
                      onClick={() => onAnalysis(doc)}
                      disabled={doc.status !== 'ready'}
                      aria-label="View Analysis"
                    >
                      <BarChart2 size={15} />
                    </button>
                    <button
                      className="action-btn action-btn--delete"
                      title="Delete"
                      onClick={() => onDelete(doc.id)}
                      aria-label="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
