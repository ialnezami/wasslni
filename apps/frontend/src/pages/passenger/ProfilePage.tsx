import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { Card, Alert } from '@/components/ui';
import apiClient from '@/api/client';

function PhotoUpload({
  label,
  currentUrl,
  endpoint,
  onSuccess,
}: {
  label: string;
  currentUrl?: string;
  endpoint: string;
  onSuccess: (url: string) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await apiClient.post<{ photoUrl?: string; licensePhotoUrl?: string }>(
        endpoint,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      onSuccess(data.photoUrl ?? data.licensePhotoUrl ?? '');
    } catch {
      setError(t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {currentUrl && (
        <img
          src={currentUrl}
          alt={label}
          className="h-24 w-24 rounded-xl object-cover border border-slate-200"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {uploading ? t('common.loading') : currentUrl ? t('profile.changePhoto') : t('profile.addPhoto')}
      </button>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [licenseUrl, setLicenseUrl] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('passenger.profileTitle')}</h2>

      <Card>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-slate-500">{t('auth.fullName')}</dt>
            <dd className="font-medium">{user?.fullName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t('auth.email')}</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-slate-900">{t('profile.photosTitle')}</h3>
        <div className="space-y-6">
          <PhotoUpload
            label={t('profile.profilePhoto')}
            currentUrl={photoUrl}
            endpoint="/users/me/photo"
            onSuccess={setPhotoUrl}
          />
          <PhotoUpload
            label={t('profile.licensePhoto')}
            currentUrl={licenseUrl}
            endpoint="/users/me/license"
            onSuccess={setLicenseUrl}
          />
        </div>
      </Card>
    </div>
  );
}
