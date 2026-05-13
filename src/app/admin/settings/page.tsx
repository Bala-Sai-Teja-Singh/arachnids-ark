'use client';

import { Save, Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/molecules/modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/shared/atoms/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Db } from '@/lib/db';
import { SystemSettings, UPIId } from '@/types';

import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const currentSettings = await Db.getSettings<SystemSettings>('system_settings');
      const defaultShipping = {
        rules: [
          { id: 'ship-1', minQuantity: 1, maxQuantity: 2, charge: 250 },
          { id: 'ship-2', minQuantity: 3, maxQuantity: 5, charge: 400 },
          { id: 'ship-3', minQuantity: 6, maxQuantity: 99, charge: 600 },
        ],
        disclaimer: 'Note: Shipping charges may vary based on the time and seasonal conditions to ensure the safety of live arrivals.',
      };

      if (currentSettings) {
        if (!currentSettings.shippingSettings) {
          currentSettings.shippingSettings = defaultShipping;
        }
        setSettings(currentSettings);
      } else {
        const defaultSettings: SystemSettings = {
          upiIds: [
            { id: 'upi-1', label: 'Primary UPI', value: 'payments@arachnidsark', isDefault: true },
          ],
          bankDetails: 'Bank Name: HDFC Bank\nAccount Name: ArachnidsArk Pvt Ltd\nAccount Number: 50200001234567\nIFSC Code: HDFC0001234',
          paymentInstructions: 'Please ensure you add your order request ID in the payment remarks.',
          emailNotifications: {
            orderConfirmations: true,
            paymentVerification: true,
            consultationReminders: true,
          },
          storeStatus: {
            maintenanceMode: false,
            acceptingConsultations: true,
          },
          modules: {
            showCourses: true,
            showProducts: true,
            showConsultations: true,
          },
          shippingSettings: defaultShipping,
        };
        setSettings(defaultSettings);
        await Db.saveSettings('system_settings', defaultSettings);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setLoading(true);
    await Db.updateSettings('system_settings', settings);
    await new Promise(r => setTimeout(r, 800));
    toast.success('System settings saved successfully');
    setLoading(false);
    router.refresh();
  };

  const addUPIId = () => {
    if (!settings) return;
    const newUPI: UPIId = {
      id: `upi-${Date.now()}`,
      label: 'New UPI',
      value: '',
      isDefault: settings.upiIds.length === 0
    };
    setSettings({
      ...settings,
      upiIds: [...settings.upiIds, newUPI]
    });
  };

  const removeUPIId = (id: string) => {
    if (!settings) return;
    const newUPIs = settings.upiIds.filter(u => u.id !== id);
    // If we removed the default, set the first one as default
    if (settings.upiIds.find(u => u.id === id)?.isDefault && newUPIs.length > 0) {
      newUPIs[0].isDefault = true;
    }
    setSettings({ ...settings, upiIds: newUPIs });
  };

  const updateUPIId = (id: string, updates: Partial<UPIId>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      upiIds: settings.upiIds.map(u => u.id === id ? { ...u, ...updates } : u)
    });
  };

  const setDefaultUPI = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      upiIds: settings.upiIds.map(u => ({ ...u, isDefault: u.id === id }))
    });
  };

  const addShippingRule = () => {
    if (!settings) return;
    const newRule = {
      id: `ship-${Date.now()}`,
      minQuantity: 1,
      maxQuantity: 1,
      charge: 0
    };
    
    const currentShipping = settings.shippingSettings || { rules: [], disclaimer: '' };
    
    setSettings({
      ...settings,
      shippingSettings: {
        ...currentShipping,
        rules: [...(currentShipping.rules || []), newRule]
      }
    });
  };

  const removeShippingRule = (id: string) => {
    if (!settings || !settings.shippingSettings) return;
    setSettings({
      ...settings,
      shippingSettings: {
        ...settings.shippingSettings,
        rules: settings.shippingSettings.rules.filter(r => r.id !== id)
      }
    });
  };

  const updateShippingRule = (id: string, updates: any) => {
    if (!settings || !settings.shippingSettings) return;
    setSettings({
      ...settings,
      shippingSettings: {
        ...settings.shippingSettings,
        rules: settings.shippingSettings.rules.map(r => r.id === id ? { ...r, ...updates } : r)
      }
    });
  };

  if (!settings) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <Button onClick={handleSave} disabled={loading} className="bg-brand-red hover:bg-brand-red-light text-white">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Settings</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Configure multiple UPI IDs and bank information displayed to users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-brand-gold uppercase tracking-widest text-[10px] font-bold">UPI IDs</Label>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase tracking-widest" onClick={addUPIId}>
                    <Plus className="mr-1 h-3 w-3" /> Add UPI ID
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {settings.upiIds.map((upi) => (
                    <div key={upi.id} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-background/30 border border-border relative group">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px]">Label</Label>
                        <Input 
                          value={upi.label} 
                          placeholder="Primary, Secondary, etc."
                          onChange={(e) => updateUPIId(upi.id, { label: e.target.value })}
                          className="bg-background/50 h-8 text-xs" 
                        />
                      </div>
                      <div className="flex-[2] space-y-1">
                        <Label className="text-[10px]">UPI ID Value</Label>
                        <Input 
                          value={upi.value} 
                          placeholder="username@upi"
                          onChange={(e) => updateUPIId(upi.id, { value: e.target.value })}
                          className="bg-background/50 h-8 text-xs font-mono" 
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          variant={upi.isDefault ? "default" : "outline"}
                          size="sm"
                          className={`h-8 text-[10px] uppercase tracking-widest ${upi.isDefault ? 'bg-brand-gold hover:bg-brand-gold text-white' : ''}`}
                          onClick={() => setDefaultUPI(upi.id)}
                        >
                          {upi.isDefault ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
                          {upi.isDefault ? 'Default' : 'Set Default'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/5"
                          onClick={() => removeUPIId(upi.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {settings.upiIds.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-2">No UPI IDs added. Users won't see UPI payment option.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Label>Bank Account Details</Label>
                <Textarea 
                  className="bg-background/50 h-32 text-sm font-mono"
                  value={settings.bankDetails}
                  onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Instructions Note</Label>
                <Textarea 
                  className="bg-background/50 text-sm"
                  value={settings.paymentInstructions}
                  onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure automated email settings (mocked for now).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Confirmations</Label>
                  <p className="text-sm text-muted-foreground">Send email when a new order request is placed.</p>
                </div>
                <Switch 
                  checked={settings.emailNotifications.orderConfirmations} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    emailNotifications: { ...settings.emailNotifications, orderConfirmations: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Payment Verification</Label>
                  <p className="text-sm text-muted-foreground">Send email when payment is verified.</p>
                </div>
                <Switch 
                  checked={settings.emailNotifications.paymentVerification} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    emailNotifications: { ...settings.emailNotifications, paymentVerification: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Consultation Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminder 24h before consultation.</p>
                </div>
                <Switch 
                  checked={settings.emailNotifications.consultationReminders} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    emailNotifications: { ...settings.emailNotifications, consultationReminders: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Shipping Configuration</CardTitle>
              <CardDescription>Set quantity-based shipping charges for live animals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-brand-gold uppercase tracking-widest text-[10px] font-bold">Shipping Rules (Tarantula Quantity)</Label>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase tracking-widest" onClick={addShippingRule}>
                    <Plus className="mr-1 h-3 w-3" /> Add Rule
                  </Button>
                </div>

                <div className="space-y-3">
                  {settings.shippingSettings?.rules.map((rule) => (
                    <div key={rule.id} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 rounded-xl bg-background/30 border border-border">
                      <div className="flex-1 space-y-1 w-full">
                        <Label className="text-[10px]">Min Qty</Label>
                        <Input 
                          type="number"
                          value={rule.minQuantity || ''} 
                          onChange={(e) => updateShippingRule(rule.id, { minQuantity: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                          className="bg-background/50 h-10 sm:h-8 text-xs w-full" 
                        />
                      </div>
                      <div className="flex-1 space-y-1 w-full">
                        <Label className="text-[10px]">Max Qty</Label>
                        <Input 
                          type="number"
                          value={rule.maxQuantity || ''} 
                          onChange={(e) => updateShippingRule(rule.id, { maxQuantity: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                          className="bg-background/50 h-10 sm:h-8 text-xs w-full" 
                        />
                      </div>
                      <div className="flex-1 space-y-1 w-full">
                        <Label className="text-[10px]">Charge (₹)</Label>
                        <Input 
                          type="number"
                          value={rule.charge || ''} 
                          onChange={(e) => updateShippingRule(rule.id, { charge: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                          className="bg-background/50 h-10 sm:h-8 text-xs font-bold w-full" 
                        />
                      </div>
                      <div className="flex justify-end pt-2 sm:pt-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/5"
                          onClick={() => removeShippingRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!settings.shippingSettings?.rules || settings.shippingSettings.rules.length === 0) && (
                    <p className="text-xs text-muted-foreground italic py-2">No shipping rules defined. Default might be free or TBD.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Label>Shipping Disclaimer</Label>
                <p className="text-[10px] text-muted-foreground mb-1">Shown during checkout to inform users about potential charge variations.</p>
                <Textarea 
                  className="bg-background/50 h-20 text-sm"
                  value={settings.shippingSettings?.disclaimer}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    shippingSettings: { ...settings.shippingSettings, disclaimer: e.target.value } 
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Store Status</CardTitle>
              <CardDescription>Control store availability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable new purchases.</p>
                </div>
                <Switch 
                  checked={settings.storeStatus.maintenanceMode} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    storeStatus: { ...settings.storeStatus, maintenanceMode: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Accepting Consultations</Label>
                  <p className="text-sm text-muted-foreground">Enable booking system.</p>
                </div>
                <Switch 
                  checked={settings.storeStatus.acceptingConsultations} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    storeStatus: { ...settings.storeStatus, acceptingConsultations: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Module Visibility</CardTitle>
              <CardDescription>Enable or disable entire modules on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Products & Shop</Label>
                  <p className="text-sm text-muted-foreground">Show shop and product collection.</p>
                </div>
                <Switch 
                  checked={settings.modules?.showProducts ?? true} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    modules: { ...(settings.modules || { showCourses: true, showProducts: true, showConsultations: true }), showProducts: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Courses</Label>
                  <p className="text-sm text-muted-foreground">Show expert courses module.</p>
                </div>
                <Switch 
                  checked={settings.modules?.showCourses ?? true} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    modules: { ...(settings.modules || { showCourses: true, showProducts: true, showConsultations: true }), showCourses: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Consultations</Label>
                  <p className="text-sm text-muted-foreground">Show booking and consultation system.</p>
                </div>
                <Switch 
                  checked={settings.modules?.showConsultations ?? true} 
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    modules: { ...(settings.modules || { showCourses: true, showProducts: true, showConsultations: true }), showConsultations: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
