'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Info,
  Loader2,
  FileQuestion,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface RiskAnalysisResult {
  executiveSummary: string;
  risks: {
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    recommendation: string;
  }[];
  missingClauses: {
    clause: string;
    reason: string;
  }[];
}

export default function AnalysisResultPage() {
  const t = useTranslations('Analyze');
  const params = useParams();
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processDocument = async () => {
      try {
        const res = await fetch(`/api/analyze/${params.id}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // defaults to claude
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.error?.message || 'Processing failed');

        setResult(data.data.analysisResult);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred during analysis';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    processDocument();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] max-w-4xl flex-col items-center justify-center py-12 text-center">
        <Loader2 className="text-primary mb-6 h-12 w-12 animate-spin" />
        <h2 className="text-2xl font-bold tracking-tight">
          {t('analyzing') || 'AI is reviewing your contract...'}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          {t('analyzing_desc') ||
            'This may take up to 30 seconds. We are scanning for liabilities, identifying red flags, and summarizing the key terms.'}
        </p>
        <div className="mt-12 w-full space-y-4 text-start">
          <Skeleton className="rouned-xl h-32 w-full" />
          <Skeleton className="rouned-xl h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container max-w-3xl py-12 text-center">
        <div className="bg-destructive/10 text-destructive inline-flex flex-col items-center rounded-xl p-6">
          <AlertTriangle className="mb-4 h-10 w-10" />
          <h2 className="text-xl font-bold">Analysis Failed</h2>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const { executiveSummary, risks, missingClauses } = result;

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return (
          <Badge variant="destructive" className="uppercase">
            High Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge
            variant="secondary"
            className="border-yellow-500/20 bg-yellow-500/10 text-yellow-600 uppercase hover:bg-yellow-500/20"
          >
            Medium Risk
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-muted-foreground uppercase">
            Low Risk
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="uppercase">
            {sev}
          </Badge>
        );
    }
  };

  return (
    <div className="container max-w-4xl space-y-8 py-12">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="bg-primary/10 text-primary rounded-lg p-3">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('results_title') || 'Contract Analysis Results'}
          </h1>
          <p className="text-muted-foreground">
            {t('results_desc') || 'Review the AI-generated risk assessment below.'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">{t('results_disclaimer')}</p>
        </div>
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-primary flex items-center gap-2">
            <Info className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 leading-relaxed">{executiveSummary}</CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-xl font-bold">
          <AlertTriangle className="text-destructive h-5 w-5" />
          Identified Risks & Red Flags
          <Badge variant="secondary" className="ms-2 rounded-full">
            {risks?.length || 0}
          </Badge>
        </h3>

        {!risks || risks.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="text-muted-foreground flex flex-col items-center pt-6 pb-6 text-center">
              <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
              <p>No major risks identified in this contract.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {risks.map((risk, idx) => (
              <Card
                key={idx}
                className={risk.severity === 'high' ? 'border-destructive/30 shadow-sm' : ''}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{risk.title}</CardTitle>
                    {getSeverityBadge(risk.severity)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">{risk.description}</p>
                  <div className="bg-muted/50 rounded-md border p-3 text-sm">
                    <span className="mb-1 block font-semibold">Recommendation:</span>
                    {risk.recommendation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-xl font-bold">
          <FileQuestion className="h-5 w-5 text-blue-500" />
          Missing Clauses
        </h3>

        {!missingClauses || missingClauses.length === 0 ? (
          <p className="text-muted-foreground">
            The contract appears to contain all standard clauses.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {missingClauses.map((missing, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{missing.clause}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{missing.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
