import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";

interface CategoryFilterProps {
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const { data: categories } = useCategories();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Categories</h3>
      <div className="space-y-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className="w-full justify-start"
        >
          All Categories
          {selectedCategory === null && (
            <Badge variant="secondary" className="ml-auto">
              {categories?.length || 0}
            </Badge>
          )}
        </Button>

        {categories?.map((category: any) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className="w-full justify-start"
          >
            {category.name}
            {selectedCategory === category.id && (
              <Badge variant="secondary" className="ml-auto">
                Active
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
