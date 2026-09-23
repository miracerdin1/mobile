import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { HelperText, IconButton, Switch, Text, TextInput } from "react-native-paper";

import { PaywallModal } from "../components/PaywallModal";
import PrimaryButton from "../components/PrimaryButton";
import FolderChip from "../components/FolderChip";
import Config from "../constants/Config";
import { useAppTheme } from "../hooks/useAppTheme";
import { markJustSaved } from "../hooks/useJustSaved";
import api from "../services/api";
import type { Link } from "../types";
import type { DuplicateLink } from "../types/addLink";
import { extractHttpUrl, normalizeHttpUrl } from "../utils/url";
import { showAlert } from "../utils/alert";

export default function AddLink() {
  const router = useRouter();
  const sharedLinkParams = useLocalSearchParams();
  const theme = useAppTheme();
  const sharedUrl = extractHttpUrl(
    sharedLinkParams.url ?? sharedLinkParams.text,
  );
  const [url, setUrl] = useState(sharedUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // Folders State
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Paywall State
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState("");

  // Duplicate-link detection (non-blocking — informational only)
  const [duplicateLink, setDuplicateLink] = useState<DuplicateLink | null>(null);
  const duplicateCheckSeq = useRef(0);

  useEffect(() => {
    if (!sharedUrl) return;

    setUrl((currentUrl) => currentUrl || sharedUrl);
    if (Platform.OS === "web") router.replace("/add");
  }, [router, sharedUrl]);

  useEffect(() => {
    fetchFolders();
  }, []);

  // Debounced duplicate check as the user types/pastes a URL.
  useEffect(() => {
    const seq = ++duplicateCheckSeq.current;
    const normalizedUrl = normalizeHttpUrl(url);
    if (!normalizedUrl) {
      setDuplicateLink(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.post(
          `${Config.API_URL}/api/links/check-duplicate`,
          { url: normalizedUrl },
        );
        if (duplicateCheckSeq.current !== seq) return; // a newer keystroke superseded this check
        setDuplicateLink(response.data?.duplicate ? response.data.link : null);
      } catch {
        // Non-critical — silently skip the hint rather than interrupt the flow.
        if (duplicateCheckSeq.current === seq) setDuplicateLink(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  const fetchFolders = async () => {
    try {
      const response = await api.get(`${Config.API_URL}/api/folders`);
      setFolders(response.data);
    } catch (err) {
      console.warn("Fetch folders error in AddLink:", err);
    }
  };

  const handleAdd = async () => {
    const normalizedUrl = extractHttpUrl(url);
    if (!normalizedUrl) {
      setError("Lütfen geçerli bir URL girin (örn. https://google.com)");
      return;
    }

    setUrl(normalizedUrl);
    setLoading(true);
    setError("");

    try {
      const response = await api.post<Link>(`${Config.API_URL}/api/links`, {
        url: normalizedUrl,
        folderId: selectedFolderId,
        isPublic,
      });
      // Home greets the new link with a tab hop and a highlighted row.
      markJustSaved(response.data);

      showAlert("Başarılı", "Link başarıyla eklendi!");
      if (Platform.OS === "web") {
        router.replace("/");
        return;
      }

      router.back();
    } catch (err: any) {
      console.error("Add Link Error:", err);
      if (err.response?.status === 402 || err.response?.data?.code === "QUOTA_EXCEEDED") {
        setPaywallReason(err.response?.data?.message || "Limit aşımı! Lütfen Pro plana yükseltin.");
        setPaywallVisible(true);
      } else {
        showAlert("Hata", `Link eklenemedi. ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.background }}>
      <TextInput
        label="Kaydedilecek URL"
        value={url}
        onChangeText={(text) => {
          setUrl(text);
          setError("");
        }}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="url"
        error={!!error}
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        style={{ marginBottom: theme.spacing.xs }}
        right={
          <TextInput.Icon
            icon="content-paste"
            accessibilityLabel="Panodan yapıştır"
            onPress={async () => {
              try {
                const hasString = await Clipboard.hasStringAsync();
                if (hasString) {
                  const content = await Clipboard.getStringAsync();
                  const clipboardUrl = extractHttpUrl(content);
                  if (!clipboardUrl) {
                    showAlert("Bilgi", "Panonuzda geçerli bir bağlantı bulunamadı.");
                    return;
                  }

                  setUrl(clipboardUrl);
                  setError("");
                } else {
                  showAlert("Bilgi", "Panonuz boş veya bir metin içermiyor.");
                }
              } catch (err) {
                console.error("Paste error:", err);
                showAlert("Hata", "Panodan veri yapıştırılamadı.");
              }
            }}
          />
        }
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      {duplicateLink && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.radius.md,
            padding: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          <IconButton icon="content-duplicate" size={18} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
          <Text
            variant="bodySmall"
            numberOfLines={2}
            style={{ flex: 1, color: theme.colors.onSurfaceVariant, marginLeft: theme.spacing.xs }}
          >
            Bu bağlantı zaten kayıtlı: {duplicateLink.title || duplicateLink.url}
          </Text>
        </View>
      )}

      <Text
        variant="titleMedium"
        style={{ fontFamily: theme.fontFamily.semibold, marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm, color: theme.colors.onSurface }}
      >
        Klasöre Ekle (İsteğe Bağlı)
      </Text>
      <View style={{ marginBottom: theme.spacing.lg, height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: theme.spacing.xs }}>
          <FolderChip
            label="Klasör Yok"
            icon="folder-off-outline"
            selected={selectedFolderId === null}
            onPress={() => setSelectedFolderId(null)}
          />
          {folders.map((f) => (
            <FolderChip
              key={f._id}
              label={f.name}
              icon={f.icon || "folder"}
              color={f.color}
              selected={selectedFolderId === f._id}
              onPress={() => setSelectedFolderId(f._id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.xl }}>
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <Text variant="labelLarge" style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
            Herkese Açık
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Bu bağlantı Bio sayfanızda Genel Bağlantılar altında listelenir.
          </Text>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} color={theme.colors.primary} />
      </View>

      <PrimaryButton onPress={handleAdd} loading={loading} disabled={loading}>
        {duplicateLink ? "Yine de Kaydet" : "Linki Kaydet"}
      </PrimaryButton>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        reason={paywallReason}
      />
    </View>
  );
}
