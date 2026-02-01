'use client';

import { useState, useRef } from 'react';
import { Client, Quote, QuoteItem, QuoteStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { generateId, formatDate } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Save,
  Send,
  FileText,
  User,
  Phone,
  MapPin,
  Calculator,
  PenTool,
  Check,
  X,
} from 'lucide-react';

interface QuoteFormProps {
  client: Client;
  visitId?: string;
  existingQuote?: Quote;
  onSave: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const TVA_RATE = 0.20; // 20% TVA

export default function QuoteForm({
  client,
  visitId,
  existingQuote,
  onSave,
  onCancel,
}: QuoteFormProps) {
  const [items, setItems] = useState<QuoteItem[]>(
    existingQuote?.items || [
      { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]
  );
  const [notes, setNotes] = useState(existingQuote?.notes || '');
  const [signatureData, setSignatureData] = useState<string | null>(
    existingQuote?.signatureData || null
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Calculer les totaux
  const totalHT = items.reduce((sum, item) => sum + item.total, 0);
  const tva = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  // Gérer les lignes du devis
  const addItem = () => {
    setItems([
      ...items,
      { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Recalculer le total si quantité ou prix unitaire change
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice;
      }
      
      return updated;
    }));
  };

  // Gestion de la signature tactile
  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const pos = 'touches' in e 
      ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    
    lastPosRef.current = pos;
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPosRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    const pos = 'touches' in e 
      ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
    
    // Sauvegarder la signature
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  // Sauvegarder le devis
  const handleSave = (status: QuoteStatus = 'draft') => {
    const mainPhone = client.portableM || client.portableMme || client.telDomicile || '';
    
    const quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
      visitId: visitId || null,
      clientId: client.id,
      date: new Date().toISOString(),
      status,
      clientName: `${client.civilite} ${client.nom} ${client.prenom}`.trim(),
      clientAddress: `${client.adresse}, ${client.codePostal} ${client.ville}`,
      clientPhone: mainPhone,
      items: items.filter(item => item.description.trim() !== ''),
      notes: notes || null,
      totalHT,
      tva,
      totalTTC,
      signatureData,
      // V2 fields
      validUntil: null,
      reminderSentAt: null,
      rejectionReason: null,
      followUpDate: null,
      createdBy: null,
    };
    
    onSave(quote);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* En-tête client */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="font-medium">
            {client.civilite} {client.nom} {client.prenom}
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{client.adresse}, {client.codePostal} {client.ville}</span>
          </div>
          {(client.portableM || client.portableMme || client.telDomicile) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{client.portableM || client.portableMme || client.telDomicile}</span>
            </div>
          )}
          <div className="text-muted-foreground">
            Date : {formatDate(new Date())}
          </div>
        </CardContent>
      </Card>

      {/* Lignes du devis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Prestations / Produits
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Ligne {index + 1}
                </span>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <Textarea
                placeholder="Description du produit ou service..."
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                rows={2}
              />
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Quantité</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Prix unit. HT</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Total HT</label>
                  <Input
                    type="text"
                    value={`${item.total.toFixed(2)} €`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totaux */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Récapitulatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total HT</span>
              <span>{totalHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA (20%)</span>
              <span>{tva.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total TTC</span>
              <span className="text-primary">{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notes / Observations</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Conditions particulières, remarques du client..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Signature client
            </CardTitle>
            {signatureData && (
              <Button variant="outline" size="sm" onClick={clearSignature}>
                Effacer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg bg-white touch-none">
            <canvas
              ref={canvasRef}
              width={300}
              height={150}
              className="w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Signez avec le doigt ou un stylet
          </p>
        </CardContent>
      </Card>

      {/* Boutons d'action fixes en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-1" />
          Annuler
        </Button>
        <Button variant="secondary" onClick={() => handleSave('draft')} className="flex-1">
          <Save className="w-4 h-4 mr-1" />
          Brouillon
        </Button>
        <Button onClick={() => handleSave('sent')} className="flex-1">
          <Check className="w-4 h-4 mr-1" />
          Valider
        </Button>
      </div>
    </div>
  );
}
