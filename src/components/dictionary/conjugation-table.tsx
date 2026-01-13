"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import type { VerbConjugation } from "@/lib/types"

interface ConjugationTableProps {
  conjugations: VerbConjugation[]
  verbType?: string
  title?: string
}

export function ConjugationTable({ conjugations, verbType, title }: ConjugationTableProps) {
  const speakWord = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "ja-JP"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const verbTypeLabels: Record<string, string> = {
    ichidan: "Ichidan (る-verb)",
    godan: "Godan (う-verb)",
    suru: "する verb",
    kuru: "くる verb",
    "i-adj": "い-adjective",
    "na-adj": "な-adjective",
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium">{title || "Conjugation Table"}</h4>
        {verbType && (
          <Badge variant="outline" className="text-xs">
            {verbTypeLabels[verbType] || verbType}
          </Badge>
        )}
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">Form</TableHead>
              <TableHead>Japanese</TableHead>
              <TableHead className="hidden sm:table-cell">Usage</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conjugations.map((conj, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-sm">{conj.form}</TableCell>
                <TableCell className="japanese-text text-lg">{conj.japanese}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{conj.usage}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => speakWord(conj.japanese)}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
