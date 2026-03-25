import { ArrowRight, X } from "lucide-react";

import { Button } from "../ui/button";
import { Card } from "../ui/card";

export default function NumberPad({
  onNumberClick,
  onClear,
  onBackspace,
  title = "لوحة الأرقام",
  className = ""
}) {
  return (
    <Card className={`flex w-[260px] flex-shrink-0 self-stretch flex-col p-4 pb-0 ${className}`.trim()}>
      <div className="mb-4 text-lg font-bold">{title}</div>
      <div className="grid flex-1 content-start grid-cols-3 gap-2 overflow-auto">
        {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-12 text-lg font-bold"
            onClick={() => onNumberClick(num)}
          >
            {num}
          </Button>
        ))}
        <Button variant="outline" className="h-12 text-lg" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="h-12 text-lg font-bold" onClick={() => onNumberClick(0)}>
          0
        </Button>
        <Button variant="outline" className="h-12 text-lg" onClick={onBackspace}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
