import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Workspace } from './model';
import {
  EMPTY_ZOHO_CONFIG,
  ZOHO_DATA_CENTERS,
  ZOHO_MODULES,
  parseTargetValue,
  targetOptions,
  targetToValue,
  type ZohoConfig,
  type ZohoMapping,
} from './zoho';
import './zoho.css';

export function ZohoSettings({ data, save }: { data: Workspace; save: (config: ZohoConfig) => void }) {
  const [cfg, setCfg] = useState<ZohoConfig>(() => ({ ...EMPTY_ZOHO_CONFIG, ...data.zoho, memberIds: { ...data.zoho?.memberIds }, mappings: [...(data.zoho?.mappings ?? [])] }));
  const [error, setError] = useState('');
  const roles = data.roles;

  const setField = <K extends keyof ZohoConfig>(key: K, value: ZohoConfig[K]) => setCfg(c => ({ ...c, [key]: value }));
  const setMemberId = (memberId: string, zohoId: string) => setCfg(c => ({ ...c, memberIds: { ...c.memberIds, [memberId]: zohoId } }));

  const addMapping = () => {
    const role = roles[0];
    const first = role ? targetOptions(role.fields)[0] : undefined;
    if (!role || !first) { setError('Add a role before creating a mapping.'); return; }
    setCfg(c => ({
      ...c,
      mappings: [...c.mappings, { id: crypto.randomUUID(), module: ZOHO_MODULES[0], zohoKey: '', label: '', roleId: role.id, target: first.target }],
    }));
  };
  const editMapping = (id: string, patch: Partial<ZohoMapping>) =>
    setCfg(c => ({ ...c, mappings: c.mappings.map(m => (m.id === id ? { ...m, ...patch } : m)) }));
  const removeMapping = (id: string) => setCfg(c => ({ ...c, mappings: c.mappings.filter(m => m.id !== id) }));

  const submit = () => {
    if (cfg.endpoint.trim()) {
      try { new URL(cfg.endpoint.trim()); } catch { setError('The sync endpoint must be a full URL (https://…).'); return; }
    }
    if (cfg.mappings.some(m => !m.zohoKey.trim() || !m.label.trim())) { setError('Every mapping needs a Zoho key and a label.'); return; }
    save({
      ...cfg,
      endpoint: cfg.endpoint.trim(),
      orgId: cfg.orgId.trim(),
      mappings: cfg.mappings.map(m => ({ ...m, zohoKey: m.zohoKey.trim(), label: m.label.trim() })),
    });
    setError('');
  };

  return (
    <section className="panel settings-panel zoho-settings">
      <h2>Zoho sync</h2>

      <div className="form-two">
        <label>
          Sync endpoint (your Zoho adapter URL)
          <input
            aria-label="Zoho sync endpoint"
            type="url"
            placeholder="https://your-adapter.example.com/pestcure/zoho"
            value={cfg.endpoint}
            onChange={e => setField('endpoint', e.target.value)}
          />
        </label>
        <label>
          Data centre
          <select aria-label="Zoho data centre" value={cfg.dataCenter} onChange={e => setField('dataCenter', e.target.value)}>
            {ZOHO_DATA_CENTERS.map(dc => (
              <option key={dc} value={dc}>{`zoho.${dc}`}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-two">
        <label>
          Organisation / portal ID <span className="muted">(optional)</span>
          <input aria-label="Zoho organisation id" value={cfg.orgId} onChange={e => setField('orgId', e.target.value)} placeholder="e.g. 60012345678" />
        </label>
        <label className="checkbox-label zoho-auto">
          <input type="checkbox" checked={Boolean(cfg.autoOnOpen)} onChange={e => setField('autoOnOpen', e.target.checked)} />
          Auto-pull when a weekly review opens
        </label>
      </div>

      <h3 className="zoho-subhead">Member Zoho IDs</h3>
      
      <div className="zoho-member-grid">
        {data.people.map(person => (
          <label key={person.id}>
            {person.name}
            <input
              aria-label={`Zoho ID for ${person.name}`}
              value={cfg.memberIds[person.id] ?? ''}
              onChange={e => setMemberId(person.id, e.target.value)}
              placeholder="zoho id / email"
            />
          </label>
        ))}
      </div>

      <div className="zoho-map-head">
        <h3 className="zoho-subhead">Field mapping</h3>
        <button type="button" className="button dashed" onClick={addMapping}>
          <Plus size={15} /> Add mapping
        </button>
      </div>
      

      {cfg.mappings.length === 0 && <p className="zoho-empty">No mappings yet.</p>}

      {cfg.mappings.map(mapping => {
        const role = roles.find(r => r.id === mapping.roleId) ?? roles[0];
        const options = role ? targetOptions(role.fields) : [];
        return (
          <div className="zoho-mapping" key={mapping.id}>
            <div className="form-three">
              <label>
                Zoho key
                <input
                  aria-label="Zoho metric key"
                  value={mapping.zohoKey}
                  onChange={e => editMapping(mapping.id, { zohoKey: e.target.value })}
                  placeholder="payments_received"
                />
              </label>
              <label>
                Label
                <input
                  aria-label="Mapping label"
                  value={mapping.label}
                  onChange={e => editMapping(mapping.id, { label: e.target.value })}
                  placeholder="Payments received"
                />
              </label>
              <label>
                Zoho module
                <select aria-label="Zoho module" value={mapping.module} onChange={e => editMapping(mapping.id, { module: e.target.value })}>
                  {ZOHO_MODULES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-two">
              <label>
                Role
                <select
                  aria-label="Mapping role"
                  value={mapping.roleId}
                  onChange={e => {
                    const nextRole = roles.find(r => r.id === e.target.value);
                    const firstTarget = nextRole ? targetOptions(nextRole.fields)[0]?.target : undefined;
                    editMapping(mapping.id, { roleId: e.target.value, ...(firstTarget ? { target: firstTarget } : {}) });
                  }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Fill this field
                <select
                  aria-label="Mapping target field"
                  value={targetToValue(mapping.target)}
                  onChange={e => {
                    const t = parseTargetValue(e.target.value);
                    if (t) editMapping(mapping.id, { target: t });
                  }}
                >
                  {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" className="icon-button zoho-remove" aria-label="Remove mapping" onClick={() => removeMapping(mapping.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" type="button" onClick={submit}>Save Zoho settings</button>
      {cfg.lastSyncAt && <p className="small-note">Last sync: {new Date(cfg.lastSyncAt).toLocaleString('en-IN')}</p>}
    </section>
  );
}
