import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Share2, Clock } from "lucide-react";
import { toast } from "sonner";
import { shareRoute, revokeRouteShare } from '@/lib/api';

interface ShareRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  routeName: string;
}

interface ShareResponse {
  shareToken: string;
  shareUrl: string;
  expiresAt?: string;
}

const ShareRouteModal = ({ isOpen, onClose, routeId, routeName }: ShareRouteModalProps) => {
  const [shareData, setShareData] = useState<ShareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [expiryHours, setExpiryHours] = useState<string>("");

  const generateShareLink = async () => {
    setIsLoading(true);
    try {
      const expiryValue = expiryHours && expiryHours !== "never" ? parseInt(expiryHours) : undefined;
      const response = await shareRoute(routeId, expiryValue);
      
      if (response.success && response.data) {
        // Construct the share URL on the frontend using current domain
        const currentOrigin = window.location.origin;
        const shareUrl = `${currentOrigin}/shared-routes/${response.data.shareToken}`;
        
        setShareData({
          ...response.data,
          shareUrl: shareUrl
        });
        toast.success('Share link generated successfully!');
      } else {
        throw new Error(response.error || 'Failed to generate share link');
      }
    } catch (error) {
      toast.error('Failed to generate share link');
      console.error('Error generating share link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareData?.shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareData.shareUrl);
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const revokeShare = async () => {
    setIsLoading(true);
    try {
      const response = await revokeRouteShare(routeId);
      
      if (response.success) {
        setShareData(null);
        toast.success('Share link revoked successfully!');
      } else {
        throw new Error(response.error || 'Failed to revoke share');
      }
    } catch (error) {
      toast.error('Failed to revoke share link');
      console.error('Error revoking share:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShareData(null);
    setExpiryHours("");
    setIsCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Route: {routeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!shareData ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="expiry">Link Expiry (Optional)</Label>
                <Select value={expiryHours} onValueChange={setExpiryHours}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiry time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={generateShareLink} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="shareUrl">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="shareUrl"
                    value={shareData.shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {shareData.expiresAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Expires: {new Date(shareData.expiresAt).toLocaleString()}
                </div>
              )}

              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Anyone with this link can:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• View the route details</li>
                  <li>• Upload photos to the route</li>
                  <li>• See existing photos</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  They cannot edit or delete the route.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          {shareData && (
            <Button
              onClick={revokeShare}
              disabled={isLoading}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Revoking...' : 'Revoke Share'}
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRouteModal;