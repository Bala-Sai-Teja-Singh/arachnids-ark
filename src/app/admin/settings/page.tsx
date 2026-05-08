'use client';

import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('System settings saved successfully');
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Manage global application configurations.</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-brand-red hover:bg-brand-red-light text-white">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Settings</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Configure the payment information displayed to users after checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input defaultValue="payments@arachnidsark" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Bank Account Details</Label>
                <Textarea 
                  className="bg-background/50 h-32"
                  defaultValue="Bank Name: HDFC Bank&#10;Account Name: ArachnidsArk Pvt Ltd&#10;Account Number: 50200001234567&#10;IFSC Code: HDFC0001234"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Instructions Note</Label>
                <Textarea 
                  className="bg-background/50"
                  defaultValue="Please ensure you add your order request ID in the payment remarks."
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Payment Verification</Label>
                  <p className="text-sm text-muted-foreground">Send email when payment is verified.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Consultation Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminder 24h before consultation.</p>
                </div>
                <Switch defaultChecked />
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
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Accepting Consultations</Label>
                  <p className="text-sm text-muted-foreground">Enable booking system.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription>Destructive administrative actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Reset Database</p>
                <p className="text-xs text-muted-foreground">This will wipe all data and re-seed the initial mock database. This cannot be undone.</p>
                <Button variant="destructive" className="w-full mt-2" onClick={() => {
                  if(confirm('Are you absolutely sure? This will delete all user data.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}>
                  Factory Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
