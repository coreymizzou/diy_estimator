import { ExternalLink } from 'lucide-react';
import {
  LABOR_RATE_SOURCES, LABOR_RATE_SOURCE_EXPLANATION,
  CLOUD_SOURCES, CLOUD_SOURCE_EXPLANATION,
  TOOLING_SOURCES,
} from '../data/benchmarks';
import { Card } from './ui';

function SourceList({ sources }: { sources: (string | { label: string; url: string })[] }) {
  return (
    <ul className="space-y-1.5">
      {sources.map(s => {
        const url = typeof s === 'string' ? s : s.url;
        const label = typeof s === 'string' ? s : s.label;
        return (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              <ExternalLink size={13} className="shrink-0" /> {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function SourcesPage() {
  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Where these numbers come from</h2>
        <p className="text-sm text-slate-600">
          Every dollar figure in this tool is an editable planning benchmark, not a quote. Each one is derived from a public
          pricing source or salary table, listed below, so you can verify it yourself and replace it with your own
          organization's actual numbers.
        </p>
      </Card>

      <Card title="Labor rates">
        <p className="text-sm text-slate-600 mb-3">{LABOR_RATE_SOURCE_EXPLANATION}</p>
        <SourceList sources={LABOR_RATE_SOURCES} />
        <p className="text-xs text-slate-500 mt-3">
          Government rates are built from OPM General Schedule base + locality pay, loaded with a standard ~36% federal
          benefits/overhead factor. Contractor rates are cross-checked against GSA CALC+ fully-burdened ceiling rates,
          which for IT services typically range from ~$85/hr (junior/help-desk tier) to ~$340/hr (senior cybersecurity SME).
        </p>
      </Card>

      <Card title="Cloud infrastructure">
        <p className="text-sm text-slate-600 mb-3">{CLOUD_SOURCE_EXPLANATION}</p>
        <SourceList sources={CLOUD_SOURCES} />
        <p className="text-xs text-slate-500 mt-3">
          Data volume and logging volume scale the Quick-mode cloud estimate: storage (S3/EBS/RDS) typically represents
          25-40% of total AWS spend, and CloudWatch Logs (billed at $0.50/GB ingested plus $0.03/GB-month archived)
          typically drives another 10-20% of cloud spend, so each tier nudges the total estimate up or down accordingly.
        </p>
      </Card>

      <Card title="Tools and licensing">
        <p className="text-sm text-slate-600 mb-3">
          Benchmark ranges are built from published per-user list pricing for common DevSecOps tooling.
        </p>
        <SourceList sources={TOOLING_SOURCES} />
      </Card>

      <Card title="External assessment">
        <p className="text-sm text-slate-600">
          The independent/3PAO assessment range reflects typical costs for third-party security or ATO assessments and
          should be replaced with an actual quote once one is available — it is the least standardized cost in this tool.
        </p>
      </Card>

      <Card>
        <p className="text-xs text-slate-500">
          None of these sources determine your organization's actual contract or cloud bill. Region, vendor, negotiated
          discounts, commitment terms, and configuration all change real costs significantly. Replace every benchmark with
          customer-validated data before using this tool for funding or acquisition decisions.
        </p>
      </Card>
    </div>
  );
}
