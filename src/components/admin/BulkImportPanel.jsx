import React from "react";
import { Upload, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Button } from "../ui/Button";
import { downloadCsvTemplate } from "../../lib/csvParse";

const BulkImportPanel = ({
  title,
  description,
  template,
  templateFilename,
  csv,
  onCsvChange,
  defaultPassword,
  onPasswordChange,
  onFileSelect,
  onSubmit,
  rowCount,
  submitting,
  result,
  entityLabel = "records",
  importLabel,
}) => (
  <Card className="border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Upload size={18} className="text-primary" /> {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files?.[0])}
          />
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary/50">
            <Upload size={16} /> Choose CSV file
          </span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => downloadCsvTemplate(templateFilename, template)}
        >
          <FileDown size={16} /> Download template
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onCsvChange(template)}>
          Load sample
        </Button>
      </div>
      <div className="space-y-1.5 max-w-xs">
        <label className="text-xs font-bold uppercase text-muted-foreground">
          Default password for all rows (optional)
        </label>
        <input
          type="password"
          placeholder="Default: password123"
          value={defaultPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
        />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          value={csv}
          onChange={(e) => onCsvChange(e.target.value)}
          rows={12}
          placeholder={template}
          className="w-full font-mono text-xs border border-border rounded-xl p-3 bg-background"
        />
        <p className="text-xs text-muted-foreground">
          {rowCount} {entityLabel} ready to import
        </p>
        <Button type="submit" className="gap-2" disabled={submitting}>
          <Upload size={16} />
          {submitting ? "Importing..." : importLabel}
        </Button>
      </form>
      {result && (
        <div className="text-sm rounded-xl bg-secondary/30 p-3 space-y-1">
          <p className="font-medium text-emerald-600">Added {result.created_count} {entityLabel}</p>
          {result.error_count > 0 && (
            <p className="text-orange-600">{result.error_count} row(s) skipped</p>
          )}
          {result.errors?.length > 0 && (
            <ul className="text-xs text-muted-foreground list-disc pl-4">
              {result.errors.slice(0, 10).map((err, i) => (
                <li key={i}>
                  Row {err.row}: {err.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

export default BulkImportPanel;
