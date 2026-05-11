'use client';

import { useEffect, useState } from 'react';
import { Save, Trash2, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/shared/atoms/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/shared/molecules/modal';
import { LocalStorage } from '@/mock-db/storage';
import type { ConsultationSettings, ConsultationPricing } from '@/types';
import { toast } from 'sonner';

export default function AdminConsultationsSettingsPage() {
  const [settings, setSettings] = useState<ConsultationSettings | null>(null);
  const [deletePricingIdx, setDeletePricingIdx] = useState<number | null>(null);

  useEffect(() => {
    const data = LocalStorage.getAll<ConsultationSettings>('consultation_settings');
    if (data.length > 0) setSettings(data[0]);
  }, []);

  const handleSave = () => {
    if (!settings) return;
    LocalStorage.setAll('consultation_settings', [settings]);
    toast.success('Consultation settings saved');
  };

  const handleAddPricing = () => {
    if (!settings) return;
    const newEntry: ConsultationPricing = {
      duration: 30,
      basePrice: 500,
      label: '30 Minutes',
    };
    setSettings({ ...settings, pricing: [...settings.pricing, newEntry] });
    toast.success('New pricing entry added');
  };

  const confirmDeletePricing = () => {
    if (!settings || deletePricingIdx === null) return;
    const newPricing = settings.pricing.filter((_, i) => i !== deletePricingIdx);
    setSettings({ ...settings, pricing: newPricing });
    setDeletePricingIdx(null);
    toast.success('Pricing entry removed');
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-brand-gold hover:bg-brand-gold/90 text-white">
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pricing Management */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Consultation Pricing Plans</CardTitle>
              <CardDescription>Define available durations and their base prices.</CardDescription>
            </div>
            <Button onClick={handleAddPricing} variant="outline" size="sm" className="border-border">
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.pricing.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                No pricing plans defined. Click "Add Plan" to create one.
              </div>
            ) : (
              settings.pricing.map((p, idx) => (
                <div key={idx} className="group relative grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border bg-background/30 hover:border-brand-gold/30 transition-all">
                  <div className="space-y-2">
                    <Label className="text-xs">Label (e.g. 30 Minutes)</Label>
                    <Input 
                      value={p.label} 
                      onChange={e => {
                        const newPricing = [...settings.pricing];
                        newPricing[idx].label = e.target.value;
                        setSettings({ ...settings, pricing: newPricing });
                      }}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Duration (Minutes)</Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        min="0"
                        placeholder="0"
                        value={p.duration === 0 ? '' : p.duration} 
                        onChange={e => {
                          const newPricing = [...settings.pricing];
                          newPricing[idx] = { ...newPricing[idx], duration: Math.max(0, Number(e.target.value)) };
                          setSettings({ ...settings, pricing: newPricing });
                        }}
                        className="bg-background/50 pl-8"
                      />
                      <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Base Price (₹)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        min="0"
                        placeholder="0"
                        value={p.basePrice === 0 ? '' : p.basePrice} 
                        onChange={e => {
                          const newPricing = [...settings.pricing];
                          newPricing[idx] = { ...newPricing[idx], basePrice: Math.max(0, Number(e.target.value)) };
                          setSettings({ ...settings, pricing: newPricing });
                        }}
                        className="bg-background/50"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeletePricingIdx(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Urgency Multipliers */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Urgency Multipliers</CardTitle>
            <CardDescription>Multipliers applied to base price.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.urgencyMultipliers.map((u, idx) => (
              <div key={u.urgency} className="space-y-2">
                <Label className="capitalize">{u.label}</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={u.multiplier === 0 ? '' : u.multiplier} 
                    onChange={e => {
                      const newM = [...settings.urgencyMultipliers];
                      newM[idx] = { ...newM[idx], multiplier: Math.max(0, Number(e.target.value)) };
                      setSettings({ ...settings, urgencyMultipliers: newM });
                    }}
                    className="bg-background/50 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">x</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deletePricingIdx !== null} 
        onClose={() => setDeletePricingIdx(null)}
        variant="confirm"
        title="Delete Pricing Plan"
        description="Are you sure you want to delete this pricing plan? Users will no longer be able to select this duration."
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setDeletePricingIdx(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePricing}>Delete</Button>
          </div>
        )}
      >
        <div className="py-2" />
      </Modal>
    </div>
  );
}
