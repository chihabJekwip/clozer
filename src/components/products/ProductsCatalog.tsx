'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { getProductsAsync, addProduct, updateProduct, getActiveProducts } from '@/lib/storage-v2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  Plus,
  Search,
  Euro,
  Tag,
  Edit,
  Eye,
  EyeOff,
  ChevronRight,
  MessageSquare,
  Shield,
  Sparkles,
  Filter,
} from 'lucide-react';

interface ProductsCatalogProps {
  selectable?: boolean;
  onSelect?: (product: Product) => void;
  selectedIds?: string[];
}

const categories = [
  'Électroménager',
  'High-Tech',
  'Mobilier',
  'Énergie',
  'Services',
  'Accessoires',
  'Autre',
];

export function ProductsCatalog({ selectable = false, onSelect, selectedIds = [] }: ProductsCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    priceHT: 0,
    tvaRate: 20,
    sku: '',
    features: [] as string[],
    salesPitch: '',
    imageUrl: '',
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await getProductsAsync();
    setProducts(data);
    setIsLoading(false);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return;

    const result = await addProduct({
      ...newProduct,
      isActive: true,
      competitorComparison: {},
      objectionHandlers: [],
    });

    if (result) {
      setProducts([result, ...products]);
      setShowAddDialog(false);
      setNewProduct({
        name: '',
        description: '',
        category: '',
        priceHT: 0,
        tvaRate: 20,
        sku: '',
        features: [],
        salesPitch: '',
        imageUrl: '',
      });
    }
  };

  const handleToggleActive = async (product: Product) => {
    const result = await updateProduct(product.id, { isActive: !product.isActive });
    if (result) {
      setProducts(products.map(p => p.id === product.id ? result : p));
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setNewProduct({ ...newProduct, features: [...newProduct.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setNewProduct({
      ...newProduct,
      features: newProduct.features.filter((_, i) => i !== index),
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesActive = showInactive || product.isActive;
    return matchesSearch && matchesCategory && matchesActive;
  });

  const ProductCard = ({ product }: { product: Product }) => {
    const priceTTC = product.priceHT * (1 + product.tvaRate / 100);
    const isSelected = selectedIds.includes(product.id);

    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          !product.isActive ? 'opacity-60' : ''
        } ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={() => {
          if (selectable && onSelect) {
            onSelect(product);
          } else {
            setSelectedProduct(product);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Product Image or Placeholder */}
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h3>
                  {product.category && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {product.category}
                    </Badge>
                  )}
                </div>
                {!product.isActive && (
                  <Badge variant="outline" className="text-gray-500">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Inactif
                  </Badge>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-lg font-bold text-green-600">
                    {priceTTC.toLocaleString('fr-FR')}€
                  </span>
                  <span className="text-xs text-gray-400 ml-1">TTC</span>
                </div>
                {product.sku && (
                  <span className="text-xs text-gray-400">
                    Réf: {product.sku}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-36 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
          {showInactive ? 'Tous' : 'Actifs'}
        </Button>

        {!selectable && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau produit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Nom du produit *</label>
                  <Input
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Ex: Pompe à chaleur Air/Eau"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Description détaillée du produit..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Catégorie</label>
                    <Select
                      value={newProduct.category}
                      onValueChange={v => setNewProduct({ ...newProduct, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Référence (SKU)</label>
                    <Input
                      value={newProduct.sku}
                      onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="PAC-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Prix HT (€)</label>
                    <Input
                      type="number"
                      value={newProduct.priceHT}
                      onChange={e => setNewProduct({ ...newProduct, priceHT: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">TVA (%)</label>
                    <Select
                      value={String(newProduct.tvaRate)}
                      onValueChange={v => setNewProduct({ ...newProduct, tvaRate: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5.5">5.5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Caractéristiques</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      placeholder="Ajouter une caractéristique..."
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" variant="outline" onClick={addFeature}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProduct.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(idx)}>
                        {feature} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Argumentaire commercial</label>
                  <Textarea
                    value={newProduct.salesPitch}
                    onChange={e => setNewProduct({ ...newProduct, salesPitch: e.target.value })}
                    placeholder="Points forts à mettre en avant..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddProduct} disabled={!newProduct.name}>
                  Créer le produit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Aucun produit trouvé</p>
            {!selectable && (
              <Button variant="link" onClick={() => setShowAddDialog(true)}>
                Ajouter un produit
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                {selectedProduct.category && (
                  <Badge variant="secondary">{selectedProduct.category}</Badge>
                )}
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedProduct.description && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Prix</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(selectedProduct.priceHT * (1 + selectedProduct.tvaRate / 100)).toLocaleString('fr-FR')}€
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedProduct.priceHT.toLocaleString('fr-FR')}€ HT + {selectedProduct.tvaRate}% TVA
                    </p>
                  </div>
                  {selectedProduct.sku && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Référence</p>
                      <p className="font-mono">{selectedProduct.sku}</p>
                    </div>
                  )}
                </div>

                {selectedProduct.features.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Caractéristiques
                    </h4>
                    <ul className="space-y-1">
                      {selectedProduct.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProduct.salesPitch && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Argumentaire
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      {selectedProduct.salesPitch}
                    </p>
                  </div>
                )}

                {selectedProduct.objectionHandlers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Gestion des objections
                    </h4>
                    <div className="space-y-2">
                      {selectedProduct.objectionHandlers.map((handler, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium text-red-600">"{handler.objection}"</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            → {handler.response}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleToggleActive(selectedProduct)}
                >
                  {selectedProduct.isActive ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Activer
                    </>
                  )}
                </Button>
                <Button onClick={() => setSelectedProduct(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
