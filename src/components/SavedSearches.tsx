import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Bookmark, BookmarkCheck, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface SavedSearch {
  id: string;
  name: string;
  filters: {
    searchQuery?: string;
    approvalStatus?: string;
    filterStatus?: string;
    selectedTags?: string[];
    selectedCities?: string[];
    priceRange?: [number, number];
    dateFilter?: string;
  };
  createdAt: string;
}

interface SavedSearchesProps {
  onLoadSearch: (search: SavedSearch) => void;
  currentFilters: SavedSearch['filters'];
}

export const SavedSearches = ({ onLoadSearch, currentFilters }: SavedSearchesProps) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const { toast } = useToast();

  // Load saved searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('property_saved_searches');
    if (stored) {
      try {
        setSavedSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved searches:', e);
      }
    }
  }, []);

  // Save to localStorage whenever searches change
  useEffect(() => {
    localStorage.setItem('property_saved_searches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  const handleSaveSearch = () => {
    if (!newSearchName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this search",
        variant: "destructive",
      });
      return;
    }

    const newSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name: newSearchName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    setSavedSearches([...savedSearches, newSearch]);
    setNewSearchName("");
    setIsSaveDialogOpen(false);

    toast({
      title: "Search saved",
      description: `"${newSearch.name}" has been saved successfully`,
    });
  };

  const handleUpdateSearch = () => {
    if (!editingSearch || !newSearchName.trim()) return;

    setSavedSearches(
      savedSearches.map((s) =>
        s.id === editingSearch.id
          ? { ...s, name: newSearchName.trim(), filters: currentFilters }
          : s
      )
    );

    setNewSearchName("");
    setEditingSearch(null);
    setIsSaveDialogOpen(false);

    toast({
      title: "Search updated",
      description: `"${newSearchName}" has been updated`,
    });
  };

  const handleDeleteSearch = (id: string) => {
    const search = savedSearches.find((s) => s.id === id);
    setSavedSearches(savedSearches.filter((s) => s.id !== id));

    toast({
      title: "Search deleted",
      description: `"${search?.name}" has been removed`,
    });
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search);
    setIsOpen(false);

    toast({
      title: "Search loaded",
      description: `Filters from "${search.name}" have been applied`,
    });
  };

  const openEditDialog = (search: SavedSearch) => {
    setEditingSearch(search);
    setNewSearchName(search.name);
    setIsSaveDialogOpen(true);
    setIsOpen(false);
  };

  const openSaveDialog = () => {
    setEditingSearch(null);
    setNewSearchName("");
    setIsSaveDialogOpen(true);
  };

  const getFilterSummary = (filters: SavedSearch['filters']) => {
    const parts = [];
    if (filters.searchQuery) parts.push(`Search: "${filters.searchQuery}"`);
    if (filters.approvalStatus && filters.approvalStatus !== 'all')
      parts.push(`Status: ${filters.approvalStatus}`);
    if (filters.selectedTags && filters.selectedTags.length > 0)
      parts.push(`${filters.selectedTags.length} tags`);
    if (filters.selectedCities && filters.selectedCities.length > 0)
      parts.push(`${filters.selectedCities.length} cities`);
    if (filters.priceRange)
      parts.push(
        `$${(filters.priceRange[0] / 1000).toFixed(0)}k-$${(filters.priceRange[1] / 1000).toFixed(0)}k`
      );

    return parts.length > 0 ? parts.join(' • ') : 'No filters';
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Saved Searches</span>
            {savedSearches.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {savedSearches.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Saved Searches</h4>
              <Button size="sm" variant="ghost" onClick={openSaveDialog} className="h-7 text-xs">
                <BookmarkCheck className="h-3 w-3 mr-1" />
                Save Current
              </Button>
            </div>

            {savedSearches.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">
                No saved searches yet
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="group p-2 rounded-md hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                    onClick={() => handleLoadSearch(search)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm flex-1">{search.name}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(search);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSearch(search.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {getFilterSummary(search.filters)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(search.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save/Edit Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSearch ? 'Update Saved Search' : 'Save Current Search'}
            </DialogTitle>
            <DialogDescription>
              {editingSearch
                ? 'Update the name and filters for this saved search'
                : 'Give your search a name to save it for later use'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
                placeholder="e.g., High Value Properties in Orlando"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Current Filters</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                {getFilterSummary(currentFilters)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingSearch ? handleUpdateSearch : handleSaveSearch}>
              {editingSearch ? 'Update' : 'Save'} Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
