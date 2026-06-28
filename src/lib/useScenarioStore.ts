import { useCallback, useMemo, useState } from 'react';
import type { Scenario, MaturityPreset } from '../data/types';
import { createScenario, createDemoScenario, nextId } from '../data/defaultScenario';
import { presetLabor, defaultCapabilities } from '../data/benchmarks';

export function useScenarioStore() {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const demo = createDemoScenario();
    return [demo];
  });
  const [activeId, setActiveId] = useState<string>(() => scenarios[0].id);

  const active = useMemo(() => scenarios.find(s => s.id === activeId) ?? scenarios[0], [scenarios, activeId]);

  const updateActive = useCallback((updater: (s: Scenario) => Scenario) => {
    setScenarios(prev => prev.map(s => (s.id === activeId ? { ...updater(s), lastUpdated: new Date().toISOString() } : s)));
  }, [activeId]);

  const addScenario = useCallback((preset: MaturityPreset) => {
    const s = createScenario(preset);
    setScenarios(prev => [...prev, s]);
    setActiveId(s.id);
    return s;
  }, []);

  const duplicateScenario = useCallback((id: string) => {
    const src = scenarios.find(s => s.id === id);
    if (!src) return;
    const copy: Scenario = { ...structuredClone(src), id: nextId('scenario'), name: `${src.name} (copy)`, isDemo: false };
    setScenarios(prev => [...prev, copy]);
    setActiveId(copy.id);
  }, [scenarios]);

  const removeScenario = useCallback((id: string) => {
    setScenarios(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fresh = createScenario('Greenfield');
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }, [activeId]);

  const renameScenario = useCallback((id: string, name: string) => {
    setScenarios(prev => prev.map(s => (s.id === id ? { ...s, name } : s)));
  }, []);

  const applyPreset = useCallback((preset: MaturityPreset) => {
    updateActive(s => {
      const labor = presetLabor(preset);
      return {
        ...s,
        preset,
        capabilities: defaultCapabilities(preset),
        initialLabor: labor.initial,
        recurringLabor: labor.recurring,
      };
    });
  }, [updateActive]);

  const resetActive = useCallback(() => {
    updateActive(s => createScenario(s.preset, { id: s.id, name: s.name }));
  }, [updateActive]);

  return {
    scenarios, active, activeId, setActiveId,
    updateActive, addScenario, duplicateScenario, removeScenario, renameScenario, applyPreset, resetActive,
  };
}

export type ScenarioStore = ReturnType<typeof useScenarioStore>;
