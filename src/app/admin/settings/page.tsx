"use client";

import React from "react";
import { Settings, Save, RefreshCw, Bell, Shield, Palette, Globe, Database } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = React.useState(false);
  const [settings, setSettings] = React.useState({
    site: {
      name: "Chosen Threads",
      description: "Premium customizable apparel",
      email: "contact@chosenthreads.com",
      phone: "+1234567890",
      address: "123 Fashion Street, Style City, SC 12345"
    },
    notifications: {
      emailNotifications: true,
      orderNotifications: true,
      reviewNotifications: true,
      lowStockAlerts: true,
      newsletterEnabled: true
    },
    appearance: {
      primaryColor: "#000000",
      accentColor: "#f97316",
      darkMode: false,
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.ico"
    },
    security: {
      requireEmailVerification: true,
      enableTwoFactor: false,
      sessionTimeout: 24,
      passwordMinLength: 8
    },
    database: {
      backupEnabled: true,
      backupFrequency: "daily",
      retentionPeriod: 90,
      autoCleanup: true
    }
  });

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${section} settings saved successfully`);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (section: string) => {
    if (confirm(`Are you sure you want to reset ${section} settings to defaults?`)) {
      // Reset to default values
      toast.success(`${section} settings reset to defaults`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your store configuration and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure your store's basic information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.site.name}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        site: { ...prev.site, name: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteEmail">Email</Label>
                    <Input
                      id="siteEmail"
                      type="email"
                      value={settings.site.email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        site: { ...prev.site, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sitePhone">Phone</Label>
                    <Input
                      id="sitePhone"
                      value={settings.site.phone}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        site: { ...prev.site, phone: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteAddress">Address</Label>
                    <Input
                      id="siteAddress"
                      value={settings.site.address}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        site: { ...prev.site, address: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="siteDescription">Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.site.description}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, description: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleReset("general")}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={() => handleSave("general")} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {key === 'emailNotifications' && 'Receive email notifications for important events'}
                          {key === 'orderNotifications' && 'Get notified when new orders are placed'}
                          {key === 'reviewNotifications' && 'Alert when customers leave reviews'}
                          {key === 'lowStockAlerts' && 'Warn when products are running low on stock'}
                          {key === 'newsletterEnabled' && 'Enable customer newsletter subscriptions'}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleReset("notifications")}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={() => handleSave("notifications")} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize your store's look and feel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.appearance.primaryColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, primaryColor: e.target.value }
                        }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.appearance.primaryColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, primaryColor: e.target.value }
                        }))}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={settings.appearance.accentColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, accentColor: e.target.value }
                        }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.appearance.accentColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, accentColor: e.target.value }
                        }))}
                        placeholder="#f97316"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={settings.appearance.logoUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, logoUrl: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      value={settings.appearance.faviconUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, faviconUrl: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="darkMode">Dark Mode</Label>
                    <p className="text-sm text-gray-500">Enable dark mode theme</p>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={settings.appearance.darkMode}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, darkMode: checked }
                    }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleReset("appearance")}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={() => handleSave("appearance")} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailVerification">Email Verification</Label>
                      <p className="text-sm text-gray-500">Require email verification for new accounts</p>
                    </div>
                    <Switch
                      id="emailVerification"
                      checked={settings.security.requireEmailVerification}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, requireEmailVerification: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Enable 2FA for admin accounts</p>
                    </div>
                    <Switch
                      id="twoFactor"
                      checked={settings.security.enableTwoFactor}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, enableTwoFactor: checked }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Select
                      value={settings.security.sessionTimeout.toString()}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, sessionTimeout: parseInt(value) }
                      }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="4"
                      max="20"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleReset("security")}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={() => handleSave("security")} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Settings
                </CardTitle>
                <CardDescription>
                  Configure database backup and maintenance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="backupEnabled">Automatic Backups</Label>
                      <p className="text-sm text-gray-500">Enable automatic database backups</p>
                    </div>
                    <Switch
                      id="backupEnabled"
                      checked={settings.database.backupEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        database: { ...prev.database, backupEnabled: checked }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={settings.database.backupFrequency}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        database: { ...prev.database, backupFrequency: value }
                      }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="retentionPeriod">Data Retention Period (days)</Label>
                    <Input
                      id="retentionPeriod"
                      type="number"
                      min="7"
                      max="365"
                      value={settings.database.retentionPeriod}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        database: { ...prev.database, retentionPeriod: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoCleanup">Automatic Cleanup</Label>
                      <p className="text-sm text-gray-500">Automatically clean up old data</p>
                    </div>
                    <Switch
                      id="autoCleanup"
                      checked={settings.database.autoCleanup}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        database: { ...prev.database, autoCleanup: checked }
                      }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleReset("database")}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={() => handleSave("database")} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
