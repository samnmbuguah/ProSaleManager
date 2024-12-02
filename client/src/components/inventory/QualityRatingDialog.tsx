import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface QualityRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number) => Promise<void>;
  isSubmitting?: boolean;
}

export function QualityRatingDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: QualityRatingDialogProps) {
  const [rating, setRating] = useState<number>(3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Quality Rating</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center text-4xl font-bold">
            {rating.toFixed(1)}
          </div>
          <Slider
            value={[rating]}
            onValueChange={(values) => setRating(values[0])}
            max={5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Poor (0)</span>
            <span>Excellent (5)</span>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(rating)}
            disabled={isSubmitting}
          >
            Update Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
