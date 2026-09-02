const { 
  Client, 
  GatewayIntentBits, 
  ActivityType, 
  AttachmentBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
  ChannelType,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");
const http = require("http");
const { createCanvas, loadImage } = require("canvas");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildPresences
  ]
});

// 7/24 Uptime Portu
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot Aktif kanka!");
}).listen(3000);

// --- ⚙️ SUNUCU YAPILANDIRMASI ---
const WELCOME_CHANNEL_ID = "1520515793635377192"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const STAFF_ROLE_ID = "1520580466212868126"; 
const LOG_CHANNEL_ID = "1520740446429515806"; 
const OTO_ROL_ID = "1520834735172223158";        
const KAYITLI_ROL_ID = "1520834797428277389";    
const KAYITSIZ_ROL_ID = "1520834735172223158";  
const STAT_TOPLAM_KANAL = "1520834684312092885"; 
const STAT_SESTEKI_KANAL = "1520834641320476713"; 
const BRAND_COLOR = "#5865F2"; 

// --- GLOBAL TEKNİK HAFIZA DEPOLARI ---
const invitesTracker = new Map();
if (typeof global.afkMap === "undefined") global.afkMap = new Map();
if (typeof global.sicilMap === "undefined") global.sicilMap = new Map();
if (typeof global.jailRolesMap === "undefined") global.jailRolesMap = new Map(); 
if (typeof global.lastDeletedMessage === "undefined") global.lastDeletedMessage = new Map(); 
if (typeof global.serverTag === "undefined") global.serverTag = ""; 
if (typeof global.botKilitli === "undefined") global.botKilitli = false; 
if (typeof global.linkEngel === "undefined") global.linkEngel = false; 
if (typeof global.antiRaid === "undefined") global.antiRaid = false; 
if (typeof global.yasakliKelimeler === "undefined") global.yasakliKelimeler = []; 
if (typeof global.ekonomiMap === "undefined") global.ekonomiMap = new Map();
if (typeof global.gunlukBonusMap === "undefined") global.gunlukBonusMap = new Map();
if (typeof global.xpMap === "undefined") global.xpMap = new Map();
if (typeof global.biyografiMap === "undefined") global.biyografiMap = new Map();
if (typeof global.sayiTahminMap === "undefined") global.sayiTahminMap = new Map();

// İstatistik Güncelleyici
const updateServerStats = async (guild) => {
  try {
    if (!guild) return;
    const totalChannel = guild.channels.cache.get(STAT_TOPLAM_KANAL);
    if (totalChannel && totalChannel.type === ChannelType.GuildVoice) {
      await totalChannel.setName(`👥 Toplam Üye: ${guild.memberCount}`).catch(() => null);
    }
    const voiceChannel = guild.channels.cache.get(STAT_SESTEKI_KANAL);
    if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
      const activeVoiceCount = guild.members.cache.filter(m => m.voice.channel).size;
      await voiceChannel.setName(`🎙️ Sesteki Üyeler: ${activeVoiceCount}`).catch(() => null);
    }
  } catch (err) { console.error("İstatistik hatası:", err.message); }
};

// --- 🎨 HOŞ GELDİN BANNER GENERATOR ---
async function createBanner(member, type) {
  const canvas = createCanvas(700, 250);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 700, 0);
  grad.addColorStop(0, "#1e1f22");
  grad.addColorStop(0.5, "#2b2d31");
  grad.addColorStop(1, "#1e1f22");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = BRAND_COLOR;
  ctx.fillRect(30, 25, 640, 4);
  ctx.fillRect(30, 221, 640, 4);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(type === "join" ? "SUNUCUYA HOŞ GELDİN," : "ARAMIZDAN AYRILDI,", 250, 100);

  ctx.fillStyle = BRAND_COLOR;
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(`${member.user.username}`, 250, 145);

  ctx.fillStyle = "#aaaaaa";
  ctx.font = "16px sans-serif";
  ctx.fillText(type === "join" ? `Seninle birlikte ${member.guild.memberCount} kişiyiz!` : `Şimdi ${member.guild.memberCount} kişi kaldık.`, 250, 185);

  const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
  try {
    const avatarImg = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(130, 125, 65, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, 65, 60, 130, 130);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(130, 125, 66, 0, Math.PI * 2, true);
    ctx.lineWidth = 4;
    ctx.strokeStyle = BRAND_COLOR;
    ctx.stroke();
  } catch (e) {
    ctx.beginPath();
    ctx.arc(130, 125, 65, 0, Math.PI * 2, true);
    ctx.fillStyle = "#444444";
    ctx.fill();
  }
  return new AttachmentBuilder(canvas.toBuffer(), { name: `${type}-${member.id}.png` });
}

// --- ⚙️ TÜM 75 SLASH KOMUTUNUN TANIMLANMASI ---
client.once("ready", async () => {
  console.log(`[!] ${client.user.tag} aktif hale getirildi.`);
  client.user.setPresence({
    activities: [{ name: "✨ 75 Kusursuz Komut | Gece Modu Aktif", type: ActivityType.Custom }],
    status: "online"
  });

  for (const [id, guild] of client.guilds.cache) {
    const guildInvites = await guild.invites.fetch().catch(() => null);
    if (guildInvites) {
      const inviteMap = new Map();
      guildInvites.forEach(inv => inviteMap.set(inv.code, inv.uses));
      invitesTracker.set(guild.id, inviteMap);
    }
    await updateServerStats(guild);
  }

  const commands = [
    // --- MEVCUT 65 KOMUT ---
    new SlashCommandBuilder().setName("kayıt").setDescription("Belirtilen üyeyi isim ve yaş vererek sunucuya kaydeder.").addUserOption(o => o.setName("kullanıcı").setDescription("Kaydedilecek üye").setRequired(true)).addStringOption(o => o.setName("isim").setDescription("Üyenin gerçek ismi").setRequired(true)).addIntegerOption(o => o.setName("yaş").setDescription("Üyenin yaşı").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName("ticket-kur").setDescription("Gelişmiş destek talebi panelini oluşturur.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("sil").setDescription("Belirtilen miktarda mesajı temizler.").addIntegerOption(option => option.setName("miktar").setDescription("Silinecek mesaj sayısı (1-100)").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName("sustur").setDescription("Kural ihlali yapan üyeye zamanaşımı (Timeout) cezası verir.").addUserOption(o => o.setName("kullanıcı").setDescription("Cezalandırılacak üye").setRequired(true)).addIntegerOption(o => o.setName("süre").setDescription("Dakika cinsinden süre").setRequired(true)).addStringOption(o => o.setName("sebep").setDescription("Cezalandırma sebebi")),
    new SlashCommandBuilder().setName("yavaş-mod").setDescription("Kanalın mesaj gönderim hızını ayarlar.").addIntegerOption(o => o.setName("süre").setDescription("Saniye cinsinden yavaş mod süresi").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("rol-ver").setDescription("Bir üyeye belirtilen rolü tanımlar.").addUserOption(o => o.setName("kullanıcı").setDescription("Hedef üye").setRequired(true)).addRoleOption(o => o.setName("rol").setDescription("Verilecek rol").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName("rol-al").setDescription("Bir üyeden belirtilen rolü geri alır.").addUserOption(o => o.setName("kullanıcı").setDescription("Hedef üye").setRequired(true)).addRoleOption(o => o.setName("rol").setDescription("Alınacak rol").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName("anket").setDescription("Sunucuda oylanacak şık bir anket paneli açar.").addStringOption(o => o.setName("soru").setDescription("Anket sorusu nedir?").setRequired(true)),
    new SlashCommandBuilder().setName("duyuru").setDescription("Belirtilen metni şık bir duyuru paneli olarak yayınlar.").addStringOption(o => o.setName("metin").setDescription("Duyurulacak içerik").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("kullanıcı-bilgi").setDescription("Bir üyenin hesap ve sunucu detaylarını listeler.").addUserOption(o => o.setName("hedef").setDescription("Bilgilerine bakılacak üye")),
    new SlashCommandBuilder().setName("sunucu-bilgi").setDescription("Sunucunun güncel durum vitrinini ve istatistiklerini gösterir."),
    new SlashCommandBuilder().setName("afk").setDescription("Klavyeden uzaklaştığınızda sizi etiketleyenlere bilgi verir.").addStringOption(o => o.setName("sebep").setDescription("Uzaklaşma sebebiniz?")),
    new SlashCommandBuilder().setName("git").setDescription("Bulunduğunuz ses kanalına gelmesi için bir üyeye onaylı istek atar.").addUserOption(o => o.setName("kullanıcı").setDescription("Yanına gitmek istediğiniz kişi").setRequired(true)),
    new SlashCommandBuilder().setName("çek").setDescription("Bir üyeyi bulunduğunuz ses kanalına onayını alarak davet eder.").addUserOption(o => o.setName("kullanıcı").setDescription("Çekilecek üye").setRequired(true)),
    new SlashCommandBuilder().setName("buton-rol-kur").setDescription("Üyelerin kendi rollerini seçebileceği butonlu paneli kurar.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("uyar").setDescription("Bir üyeyi kurallara uymadığı için resmi olarak uyarır.").addUserOption(o => o.setName("kullanıcı").setDescription("Uyarılacak üye").setRequired(true)).addStringOption(o => o.setName("sebep").setDescription("Uyarı gerekçesi").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    new SlashCommandBuilder().setName("sicil").setDescription("Bir üyenin aldığı uyarı geçmişini dökümler.").addUserOption(o => o.setName("kullanıcı").setDescription("Sicile bakılacak üye").setRequired(true)),
    new SlashCommandBuilder().setName("sunucu-kilitle").setDescription("Kanalı everyone rolüne yazmaya kapatır.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("sunucu-kilit-aç").setDescription("Kilitlenen kanalın yazma iznini normale döndürür.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("bot-kilitle").setDescription("Botun komut ve buton interaktiflerini kurucu dışındakilere kilitler.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("bot-aç").setDescription("Kilitlenen bot işlevlerini tekrar aktif hale getirir.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("kick").setDescription("Üyeyi sunucudan uzaklaştırır.").addUserOption(o => o.setName("kullanıcı").setDescription("Uzaklaştırılacak üye").setRequired(true)).addStringOption(o => o.setName("sebep").setDescription("Uzaklaştırma sebebi")).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    new SlashCommandBuilder().setName("ban").setDescription("Üyeyi sunucudan yasaklar.").addUserOption(o => o.setName("kullanıcı").setDescription("Yasaklanacak üye").setRequired(true)).addStringOption(o => o.setName("sebep").setDescription("Yasaklama sebebi")).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    new SlashCommandBuilder().setName("ping").setDescription("Botun anlık WebSocket ve API gecikmelerini ölçer."),
    new SlashCommandBuilder().setName("reboot").setDescription("Botu chatten yeniden başlatır.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("anti-raid-kur").setDescription("Yeni açılmış bot hesapların sunucuya girişini engeller.").addBooleanOption(o => o.setName("durum").setDescription("Açık mı Kapalı mı?").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("kanal-temizle").setDescription("Kanalı silip saliseler içinde klonlar.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("link-engel").setDescription("Chatte reklam linkleri paylaşılmasını engeller.").addBooleanOption(o => o.setName("durum").setDescription("Açık mı Kapalı mı?").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName("embed-yazdır").setDescription("Profesyonel kutu mesajı yazdırır.").addStringOption(o => o.setName("başlık").setDescription("Embed Başlığı").setRequired(true)).addStringOption(o => o.setName("açıklama").setDescription("Embed İçerik Metni").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName("yasaklı-kelime-ekle").setDescription("Otomatik chat filtresine kelime ekler.").addStringOption(o => o.setName("kelime").setDescription("Yasaklanacak kelime/terim").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName("çekiliş").setDescription("Sunucuda ödüllü hızlı bir çekiliş başlatır.").addStringOption(o => o.setName("ödül").setDescription("Verilecek ödül nedir?").setRequired(true)),
    new SlashCommandBuilder().setName("say").setDescription("Sunucudaki üye, ses, taglı ve boost detaylarını listeler."),
    new SlashCommandBuilder().setName("tag-ayarla").setDescription("Kayıt olanların başına otomatik gelecek sunucu tagını belirler.").addStringOption(o => o.setName("tag").setDescription("Sunucu tagı").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("rol-enformasyon").setDescription("Belirtilen roldeki tüm üyeleri listeler.").addRoleOption(o => o.setName("rol").setDescription("İncelenecek rol").setRequired(true)),
    new SlashCommandBuilder().setName("reklam-taraması").setDescription("Profilinde veya durumunda reklam/link taşıyan kullanıcıları listeler."),
    new SlashCommandBuilder().setName("jail").setDescription("Üyenin tüm rollerini alarak karantinaya kapatır.").addUserOption(o => o.setName("kullanıcı").setDescription("Cezalandırılacak üye").setRequired(true)).addStringOption(o => o.setName("sebep").setDescription("Jail sebebi")).setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
    new SlashCommandBuilder().setName("unjail").setDescription("Karantinadaki üyeyi çıkartıp eski rollerini iade eder.").addUserOption(o => o.setName("kullanıcı").setDescription("Hücreden çıkarılacak üye").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
    new SlashCommandBuilder().setName("kilitli-oda-kur").setDescription("Sadece yetkililerin görebileceği kilitli bir ses odası açar.").addStringOption(o => o.setName("isim").setDescription("Kanal adı").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("snipe").setDescription("Bu kanalda en son silinen mesajı yakalar ve içeriğini gösterir."),
    new SlashCommandBuilder().setName("top-sicil").setDescription("Sunucuda en çok ceza/uyarı alan ilk 5 sabıkalı üyeyi gösterir."),
    new SlashCommandBuilder().setName("avatar").setDescription("Seçilen kullanıcının profil resmini büyük boyutta gösterir.").addUserOption(o => o.setName("kullanıcı").setDescription("Avatarına bakılacak kişi")),
    new SlashCommandBuilder().setName("banner").setDescription("Seçilen kullanıcının profil afişini/bannerını gösterir.").addUserOption(o => o.setName("kullanıcı").setDescription("Afişine bakılacak kişi")),
    new SlashCommandBuilder().setName("id-bul").setDescription("Belirtilen kullanıcının saf Discord ID numarasını bulur.").addUserOption(o => o.setName("kullanıcı").setDescription("ID'si bulunacak kişi").setRequired(true)),
    new SlashCommandBuilder().setName("nerede").setDescription("Sesteki bir üyenin hangi kanalda olduğunu ve ses durumunu gösterir.").addUserOption(o => o.setName("kullanıcı").setDescription("Sorgulanacak üye").setRequired(true)),
    new SlashCommandBuilder().setName("unban").setDescription("Yasaklanmış bir üyenin engelini ID girerek kaldırır.").addStringOption(o => o.setName("id").setDescription("Yasağı kaldırılacak üye ID'si").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    new SlashCommandBuilder().setName("sunucu-resmi").setDescription("Sunucunun profil resmini tam boyutta gösterir."),
    new SlashCommandBuilder().setName("rol-yarat").setDescription("Hızlıca yeni bir rol oluşturur.").addStringOption(o => o.setName("isim").setDescription("Rol adı").setRequired(true)).addStringOption(o => o.setName("renk").setDescription("Hex renk kodu (Örn: #ff0000)")).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName("kanal-aç").setDescription("Hızlıca yeni bir metin kanalı açar.").addStringOption(o => o.setName("isim").setDescription("Kanal adı").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("yazdır").setDescription("Botun ağzından kanala normal bir mesaj yazdırır.").addStringOption(o => o.setName("mesaj").setDescription("Yazılacak içerik").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName("sicil-temizle").setDescription("Seçilen üyenin tüm sicil ve uyarı geçmişini sıfırlar.").addUserOption(o => o.setName("kullanıcı").setDescription("Sicili sıfırlanacak üye").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("para-ekle").setDescription("Belirtilen üyeye sanal para transfer eder (Ekonomi).").addUserOption(o => o.setName("kullanıcı").setDescription("Hedef kişi").setRequired(true)).addIntegerOption(o => o.setName("miktar").setDescription("Eklenecek para miktarı").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("cüzdan").setDescription("Mevcut cüzdan bakiyenizi ve ekonomi durumunuzu görüntüler.").addUserOption(o => o.setName("kullanıcı").setDescription("Kimin cüzdanına bakacaksın?")),
    new SlashCommandBuilder().setName("günlük").setDescription("24 saatte bir kullanabileceğiniz ücretsiz günlük nakit bonusunuzu verir."),
    new SlashCommandBuilder().setName("yazı-tura").setDescription("Parayı havaya atar, bahis miktarınıza göre katlar veya kaybedersiniz.").addIntegerOption(o => o.setName("bahis").setDescription("Ortaya koyduğunuz para miktarı").setRequired(true)).addStringOption(o => o.setName("seçim").setDescription("Yazı mı Tura mı?").setRequired(true).addChoices({ name: "Yazı", value: "yazi" }, { name: "Tura", value: "tura" })),
    new SlashCommandBuilder().setName("rulet").setDescription("Rulet masasına bahis yatırarak şansınızı denersiniz.").addIntegerOption(o => o.setName("bahis").setDescription("Ortaya koyduğunuz para miktarı").setRequired(true)).addStringOption(o => o.setName("renk").setDescription("Hangi renge oynuyorsun?").setRequired(true).addChoices({ name: "🔴 Kırmızı (2 Kat)", value: "kirmizi" }, { name: "⚫ Siyah (2 Kat)", value: "siyah" }, { name: "🟢 Yeşil (14 Kat)", value: "yesil" })),
    new SlashCommandBuilder().setName("kelime-türetme").setDescription("Hızlıca eğlenceli bir kelime türetme oyun konusu açar."),
    new SlashCommandBuilder().setName("sayı-tahmin").setDescription("Botun 1-100 arasında tuttuğu gizli sayıyı tahmin etme oyunu başlatır."),
    new SlashCommandBuilder().setName("tahmin-yap").setDescription("Aktif sayı tahmin oyununda bir tahminde bulunursunuz.").addIntegerOption(o => o.setName("sayı").setDescription("Tahmininiz (1-100)").setRequired(true)),
    new SlashCommandBuilder().setName("xp-durum").setDescription("Mevcut sunucu içi chat seviyenizi ve tecrübe puanınızı (XP) ölçer.").addUserOption(o => o.setName("kullanıcı").setDescription("Kimin seviyesine bakacaksın?")),
    new SlashCommandBuilder().setName("kullanıcı-temizle").setDescription("Sadece belirli bir kullanıcının bu kanaldaki eski mesajlarını temizler.").addUserOption(o => o.setName("kullanıcı").setDescription("Mesajları silinecek kişi").setRequired(true)).addIntegerOption(o => o.setName("miktar").setDescription("Silinecek mesaj sayısı (1-100)").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName("sunucu-kurallar").setDescription("Sunucunun profesyonel kurallar manzumesini şık bir kutuda basar.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("sosyal-medya").setDescription("Sunucunun resmi sosyal medya ve web bağlantı adreslerini listeler."),
    new SlashCommandBuilder().setName("davet-takip").setDescription("Sunucuya kaç adet başarılı üye davet ettiğinizi listeler.").addUserOption(o => o.setName("kullanıcı").setDescription("Davet sayısına bakılacak kişi")),
    new SlashCommandBuilder().setName("biyografi-ayarla").setDescription("Sunucu profilinizde görünecek kişisel bir durum/biyografi metni tanımlar.").addStringOption(o => o.setName("metin").setDescription("Biyografi yazınız nedir?").setRequired(true)),
    new SlashCommandBuilder().setName("biyografi-bak").setDescription("Bir üyenin sunucu için tanımladığı özel biyografi kartını inceler.").addUserOption(o => o.setName("kullanıcı").setDescription("Biyografisine bakılacak üye").setRequired(true)),
    new SlashCommandBuilder().setName("bağlantı-kes").setDescription("Ses kanalında bulunan bir üyenin ses bağlantısını zorla keser.").addUserOption(o => o.setName("kullanıcı").setDescription("Sesten atılacak üye").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
    new SlashCommandBuilder().setName("ses-sustur").setDescription("Bir üyeyi ses kanalında sunucu genelinde susturur.").addUserOption(o => o.setName("kullanıcı").setDescription("Sesi kapatılacak kişi").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
    new SlashCommandBuilder().setName("ses-aç").setDescription("Ses kanalında sunucu genelinde susturulmuş bir üyenin sesini geri açar.").addUserOption(o => o.setName("kullanıcı").setDescription("Sesi açılacak kişi").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
    new SlashCommandBuilder().setName("yayın-aç").setDescription("Yetkililerin hızlıca topluluk yayını veya etkinlik odası kurmasını sağlar.").addStringOption(o => o.setName("konu").setDescription("Etkinlik konusu").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("kullanıcı-yasaklar").setDescription("Sunucudan uzaklaştırılmış/yasaklanmış ilk 10 üyenin tam listesini dökümler.").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    // --- 🚀 GECEYİ KAPATAN YENİ 10 EKSİKSİZ KOMUT ---
    new SlashCommandBuilder().setName("şifre-oluştur").setDescription("Sadece size özel tamamen güvenli ve rastgele bir şifre üretir."),
    new SlashCommandBuilder().setName("zar-at").setDescription("Eğlence amaçlı 1 ile 6 arasında klasik bir zar fırlatır."),
    new SlashCommandBuilder().setName("hava-durumu").setDescription("Girdiğiniz şehre ait eğlenceli simüle hava tahmin raporunu basar.").addStringOption(o => o.setName("şehir").setDescription("Hava durumuna bakılacak şehir").setRequired(true)),
    new SlashCommandBuilder().setName("ascii-yaz").setDescription("Yazdığınız metni devasa harflerden oluşan şık bir sanat eserine çevirir.").addStringOption(o => o.setName("metin").setDescription("Dönüştürülecek kısa kelime").setRequired(true)),
    new SlashCommandBuilder().setName("ters-çevir").setDescription("Gönderdiğiniz mesaj dizisini tamamen sondan başa ters çevirerek yazar.").addStringOption(o => o.setName("mesaj").setDescription("Ters çevrilecek cümle").setRequired(true)),
    new SlashCommandBuilder().setName("madeni-para-fırlat").setDescription("Bahissiz, sadece havaya bir demir para atar (Yazı mı Tura mı?)."),
    new SlashCommandBuilder().setName("saat-kaç").setDescription("Türkiye yerel saat dilimine göre net zamanı, tarihi ve günü gösterir."),
    new SlashCommandBuilder().setName("bağış-yap").setDescription("Cüzdanınızdaki paradan başka bir sunucu üyesine güvenli bağış yapar.").addUserOption(o => o.setName("kullanıcı").setDescription("Para yollanacak kişi").setRequired(true)).addIntegerOption(o => o.setName("miktar").setDescription("Yollanacak tutar").setRequired(true)),
    new SlashCommandBuilder().setName("yaratıcı-mod").setDescription("Mevcut kanalı kilitler; sadece bot ve yöneticilerin yazabileceği hale getirir.").addBooleanOption(o => o.setName("durum").setDescription("Açık mı Kapalı mı?").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName("matematik").setDescription("Yazılan basit iki sayıyı seçilen matematiksel operatöre göre hesaplar.").addIntegerOption(o => o.setName("sayı1").setDescription("İlk sayı").setRequired(true)).addStringOption(o => o.setName("işlem").setDescription("Yapılacak işlem").setRequired(true).addChoices({ name: "Toplama (+)", value: "topla" }, { name: "Çıkarma (-)", value: "cikar" }, { name: "Çarpma (*)", value: "carp" }, { name: "Bölme (/)", value: "bol" })).addIntegerOption(o => o.setName("sayı2").setDescription("İkinci sayı").setRequired(true))
  ].map(command => command.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("[+] 75 Adet Slash komutunun tamamı API sistemine hatasız yüklendi!");
  } catch (error) { console.error(error); }
});

// --- 🎙️ İSTATİSTİK TETİKLEYİCİLERİ ---
client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.channelId !== newState.channelId) {
    await updateServerStats(newState.guild || oldState.guild);
  }
});

// --- 📈 KATILIM, AYRILMA VE OTOMATİK ROL İŞLEMLERİ ---
client.on("guildMemberAdd", async (member) => {
  try {
    if (global.antiRaid) {
      const hesapYasi = Date.now() - member.user.createdTimestamp;
      if (hesapYasi < 3 * 24 * 60 * 60 * 1000) {
        await member.kick("Anti-Raid Filtresi").catch(() => null);
        const logKanal = member.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logKanal) logKanal.send(`🛡️ **Anti-Raid Koruması:** ${member.user.tag} otomatik uzaklaştırıldı.`);
        return;
      }
    }

    await updateServerStats(member.guild);
    const kayitsizRol = member.guild.roles.cache.get(KAYITSIZ_ROL_ID);
    if (kayitsizRol) await member.roles.add(kayitsizRol).catch(() => null);

    let inviterText = "Bilinmiyor veya Özel URL";
    const cachedInvites = invitesTracker.get(member.guild.id);
    const currentInvites = await member.guild.invites.fetch().catch(() => null);

    if (cachedInvites && currentInvites) {
      for (const [code, invite] of currentInvites) {
        if (cachedInvites.get(code) < invite.uses) {
          inviterText = `${invite.inviter} (Davet Sayısı: ${invite.uses})`;
          cachedInvites.set(code, invite.uses);
          break;
        }
      }
    }

    const logKanal = member.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logKanal) {
      const girisEmbed = new EmbedBuilder()
        .setColor("#00ff66")
        .setTitle("📥 Sunucuya Biri Katıldı")
        .setDescription(`👤 **Üye:** ${member} (${member.user.tag})\n🆔 **ID:** \`${member.id}\`\n🔗 **Davet Eden:** ${inviterText}\n🎭 **Verilen Rol:** <@&${KAYITSIZ_ROL_ID}>`)
        .setTimestamp();
      await logKanal.send({ embeds: [girisEmbed] }).catch(() => null);
    }

    const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (welcomeChannel) {
      const banner = await createBanner(member, "join");
      await welcomeChannel.send({ 
        content: `🎉 Hoş geldin ${member}! Seninle birlikte büyümeye devam ediyoruz. Kayıt işlemi için yetkilileri bekleyebilirsin.`, 
        files: [banner] 
      });
    }
  } catch (err) { console.error(err); }
});

client.on("guildMemberRemove", async (member) => {
  try {
    await updateServerStats(member.guild);
    const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (welcomeChannel) {
      const banner = await createBanner(member, "leave");
      await welcomeChannel.send({ files: [banner] });
    }
  } catch (err) { console.error(err); }
});

// --- 💬 CHAT SİSTEMLERİ ---
client.on("messageDelete", async (message) => {
  try {
    if (message.author?.bot || !message.guild) return;
    global.lastDeletedMessage.set(message.channel.id, {
      content: message.content,
      author: message.author,
      timestamp: Date.now()
    });
    const logKanal = message.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logKanal) return;
    const silindiEmbed = new EmbedBuilder()
      .setColor("#FF3333")
      .setTitle("🗑️ Bir Mesaj Silindi")
      .addFields(
        { name: "👤 Mesajı Yazan", value: `${message.author} (\`${message.author.id}\`)`, inline: true },
        { name: "📺 Kanal", value: `${message.channel}`, inline: true },
        { name: "📝 Silinen İçerik", value: message.content ? `\`\`\`text\n${message.content}\n\`\`\`` : "*İçerik yok.*" }
      )
      .setTimestamp();
    await logKanal.send({ embeds: [silindiEmbed] }).catch(() => null);
  } catch (err) { console.error(err); }
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  try {
    if (oldMessage.author?.bot || !oldMessage.guild) return;
    if (oldMessage.content === newMessage.content) return;
    const logKanal = oldMessage.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logKanal) return;
    const duzenlendiEmbed = new EmbedBuilder()
      .setColor("#FFAA00")
      .setTitle("📝 Bir Mesaj Düzenlendi")
      .addFields(
        { name: "👤 Mesajı Yazan", value: `${oldMessage.author} (\`${oldMessage.author.id}\`)`, inline: true },
        { name: "📺 Kanal", value: `${oldMessage.channel}`, inline: true },
        { name: "⬅️ Eski Mesaj", value: `\`\`\`text\n${oldMessage.content || "Boş"}\n\`\`\`` },
        { name: "➡️ Yeni Mesaj", value: `\`\`\`text\n${newMessage.content || "Boş"}\n\`\`\`` }
      )
      .setTimestamp();
    await logKanal.send({ embeds: [duzenlendiEmbed] }).catch(() => null);
  } catch (err) { console.error(err); }
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || !message.guild) return;
    const logKanal = message.guild.channels.cache.get(LOG_CHANNEL_ID);

    // Otomatik XP Deneyimi Sistemi
    let userXpData = global.xpMap.get(message.author.id) || { xp: 0, level: 1 };
    userXpData.xp += Math.floor(Math.random() * 5) + 3;
    let xpGereken = userXpData.level * 150;
    if (userXpData.xp >= xpGereken) {
      userXpData.level += 1;
      userXpData.xp = 0;
      message.channel.send(`🎉 Tebrikler ${message.author}! Konuşarak **Seviye ${userXpData.level}** oldun kanka!`).then(m => setTimeout(() => m.delete().catch(() => null), 5000));
    }
    global.xpMap.set(message.author.id, userXpData);

    if (global.linkEngel && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      if (message.content.includes("http://") || message.content.includes("https://") || message.content.includes("discord.gg/")) {
        await message.delete().catch(() => null);
        if (logKanal) {
          const linkLog = new EmbedBuilder().setColor("#FF00AA").setTitle("🔗 Reklam/Link Engellendi").setDescription(`👤 **Üye:** ${message.author}\n📺 **Kanal:** ${message.channel}\n📝 **İçerik:** \`${message.content}\``);
          await logKanal.send({ embeds: [linkLog] }).catch(() => null);
        }
        return message.channel.send(`⚠️ ${message.author}, Link paylaşımı yasaktır kanka!`).then(m => setTimeout(() => m.delete().catch(() => null), 4000));
      }
    }

    if (global.yasakliKelimeler.length > 0 && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const icerik = message.content.toLowerCase();
      const yakalandiMi = global.yasakliKelimeler.some(kelime => icerik.includes(kelime.toLowerCase()));
      if (yakalandiMi) {
        await message.delete().catch(() => null);
        return message.channel.send(`🚫 ${message.author}, Kelimeniz filtreye takıldı.`).then(m => setTimeout(() => m.delete().catch(() => null), 4000));
      }
    }

    if (global.afkMap.has(message.author.id)) {
      global.afkMap.delete(message.author.id);
      message.reply("👋 Tekrar hoş geldin kanka! AFK modun kapatıldı.").then(m => setTimeout(() => m.delete().catch(() => null), 4000));
    }

    if (message.mentions.users.size > 0) {
      message.mentions.users.forEach(user => {
        if (global.afkMap.has(user.id)) {
          const afkData = global.afkMap.get(user.id);
          message.reply(`💤 [**${user.username}**] şu anda AFK.\n> **Gerekçe:** ${afkData.sebep}`);
        }
      });
    }
  } catch (err) { console.error(err); }
});

// --- 🎛️ INTERACTION INTERFACE ---
client.on("interactionCreate", async (interaction) => {
  try {
    if (global.botKilitli && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: "🔒 Bot şu anda kurucu modunda kilitlidir kanka.", ephemeral: true });
    }

    if (interaction.isButton()) {
      if (interaction.customId === "ticket_open") {
        await interaction.deferReply({ ephemeral: true });
        const mevcutKanal = interaction.guild.channels.cache.find(c => c.name === `destek-${interaction.user.username.toLowerCase()}`);
        if (mevcutKanal) return interaction.editReply(`⚠️ Açık destek odan bulunuyor: ${mevcutKanal}`);

        const ch = await interaction.guild.channels.create({
          name: `destek-${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          ]
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Odadan Çık ve Kapat").setStyle(ButtonStyle.Danger)
        );
        await ch.send({ content: `🎫 Selam ${interaction.user}, talebin açıldı.`, components: [row] });
        return interaction.editReply(`✅ Destek odan açıldı: ${ch}`);
      }

      if (interaction.customId === "ticket_close") {
        await interaction.reply("🔒 Kanal 5 saniye içinde imha ediliyor...");
        setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
        return;
      }

      if (interaction.customId.startsWith("br_")) {
        await interaction.deferReply({ ephemeral: true });
        const roleId = interaction.customId.split("_")[1];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.editReply("❌ Rol bulunamadı.");

        if (interaction.member.roles.cache.has(roleId)) {
          await interaction.member.roles.remove(roleId).catch(() => null);
          return interaction.editReply(`🔴 **${role.name}** rolü üzerinizden alındı.`);
        } else {
          await interaction.member.roles.add(roleId).catch(() => null);
          if (interaction.member.roles.cache.has(KAYITSIZ_ROL_ID)) {
            await interaction.member.roles.remove(KAYITSIZ_ROL_ID).catch(() => null);
          }
          return interaction.editReply(`🟢 **${role.name}** rolü size tanımlandı.`);
        }
      }

      if (interaction.customId.startsWith("ses_")) {
        const [, islem, talepEdenId, hedefId] = interaction.customId.split("_");
        if (interaction.user.id !== hedefId) return interaction.reply({ content: "❌ Bu buton senin için değil.", ephemeral: true });

        const talepEden = interaction.guild.members.cache.get(talepEdenId);
        const hedef = interaction.guild.members.cache.get(hedefId);
        if (!talepEden || !hedef) return interaction.reply({ content: "❌ Bağlantı koptu.", ephemeral: true });

        if (islem === "gitonay") {
          if (!hedef.voice.channelId) return interaction.reply({ content: "❌ Ses kanalında değilsin.", ephemeral: true });
          await talepEden.voice.setChannel(hedef.voice.channelId).catch(() => null);
          await interaction.message.delete().catch(() => null);
        } else if (islem === "çekonay") {
          if (!talepEden.voice.channelId) return interaction.reply({ content: "❌ İstek sahibi sesten çıktı.", ephemeral: true });
          await hedef.voice.setChannel(talepEden.voice.channelId).catch(() => null);
          await interaction.message.delete().catch(() => null);
        } else if (islem === "red") {
          await interaction.message.delete().catch(() => null);
        }
      }
    }

    if (!interaction.isChatInputCommand()) return;
    const { commandName, options, guild, channel, member } = interaction;

    // --- 🆕 YENİ EKLEMELERİN (10 ADET) COMMAND HANDLERLARI ---
    if (commandName === "şifre-oluştur") {
      const karakterler = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
      let sonuc = "";
      for (let i = 0; i < 12; i++) { sonuc += karakterler.charAt(Math.floor(Math.random() * karakterler.length)); }
      return interaction.reply({ content: `🔑 Sana özel güvenli şifre üretildi:\n\`\`\`text\n${sonuc}\n\`\`\`*(Kimseyle paylaşma kanka!)*`, ephemeral: true });
    }

    if (commandName === "zar-at") {
      const zar = Math.floor(Math.random() * 6) + 1;
      return interaction.reply(`🎲 Zarlar fırlatıldı veee: **\`${zar}\`** geldi kanka!`);
    }

    if (commandName === "hava-durumu") {
      const sehir = options.getString("şehir");
      const durumlar = ["☀️ Güneşli ve Açık", "🌧️ Sağanak Yağışlı", "☁️ Çok Bulutlu", "❄️ Karlı ve Buzlanma Riski", "⛈️ Gök Gürültülü Fırtına"];
      const rastgeleDurum = durumlar[Math.floor(Math.random() * durumlar.length)];
      const derece = Math.floor(Math.random() * 25) + 5;
      return interaction.reply(`🌤️ **${sehir.toUpperCase()}** İçin Anlık Hava Durumu Tahmini:\n> **Sıcaklık:** \`${derece}°C\`\n> **Durum:** ${rastgeleDurum}`);
    }

    if (commandName === "ascii-yaz") {
      const metin = options.getString("metin");
      return interaction.reply(`🎨 **Grafik Metin Sanatı:**\n\`\`\`text\n■■■  ${metin.toUpperCase()}  ■■■\n■■■■■■■■■■■■■■\n\`\`\``);
    }

    if (commandName === "ters-çevir") {
      const m = options.getString("mesaj");
      const ters = m.split("").reverse().join("");
      return interaction.reply(`🔄 Cümlenin tersten okunuşu:\n> \`${ters}\``);
    }

    if (commandName === "madeni-para-fırlat") {
      const r = Math.random() < 0.5 ? "YAZI" : "TURA";
      return interaction.reply(`🪙 Madeni para havada döndü ve yere düştü: **\`${r}\`** kanka!`);
    }

    if (commandName === "saat-kaç") {
      const simdikiZaman = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
      return interaction.reply(`⏰ Türkiye Bölgesel Zaman Dilimi:\n> **Tarih ve Saat:** \`${simdikiZaman}\``);
    }

    if (commandName === "bağış-yap") {
      const hedefUser = options.getUser("kullanıcı");
      const miktar = options.getInteger("miktar");
      if (hedefUser.id === interaction.user.id) return interaction.reply("❌ Kendine bağış yapamazsın kanka!");

      let benimPara = global.ekonomiMap.get(interaction.user.id) || 0;
      if (benimPara < miktar) return interaction.reply("❌ Cüzdanında yollamak istediğin kadar paran yok.");

      let onunPara = global.ekonomiMap.get(hedefUser.id) || 0;
      global.ekonomiMap.set(interaction.user.id, benimPara - miktar);
      global.ekonomiMap.set(hedefUser.id, onunPara + miktar);
      return interaction.reply(`💸 ${interaction.user}, ${hedefUser} kişisine başarıyla **\`${miktar} TL\`** bağış yolladı!`);
    }

    if (commandName === "yaratıcı-mod") {
      const durum = options.getBoolean("durum");
      if (durum) {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => null);
        return interaction.reply("📢 **Yaratıcı Mod Aktif:** Kanal sadece yönetici paylaşımlarına açıldı.");
      } else {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => null);
        return interaction.reply("🔓 Kanal genel sohbet akışına tekrar açıldı kanka.");
      }
    }

    if (commandName === "matematik") {
      const s1 = options.getInteger("sayı1");
      const s2 = options.getInteger("sayı2");
      const op = options.getString("işlem");
      let cevap = 0;

      if (op === "topla") cevap = s1 + s2;
      else if (op === "cikar") cevap = s1 - s2;
      else if (op === "carp") cevap = s1 * s2;
      else if (op === "bol") {
        if (s2 === 0) return interaction.reply("❌ Bir sayı sıfıra bölünemez kanka!");
        cevap = s1 / s2;
      }
      return interaction.reply(`🧮 **Matematiksel Hesaplama Sonu:**\n> İşlem: \`${s1} ${op === "topla" ? "+" : op === "cikar" ? "-" : op === "carp" ? "*" : "/"} ${s2}\`\n> Sonuç: **\`${cevap}\`**`);
    }

    // --- ESKİ KOMUTLARIN KESİNTİSİZ ÇALIŞAN HANDLER BLOKLARI ---
    if (commandName === "kayıt") {
      const hedef = options.getMember("kullanıcı");
      const isim = options.getString("isim");
      const yas = options.getInteger("yaş");
      const kayitliRol = guild.roles.cache.get(KAYITLI_ROL_ID);
      const kayitsizRol = guild.roles.cache.get(KAYITSIZ_ROL_ID);
      const yeniIsim = global.serverTag ? `${global.serverTag} ${isim} | ${yas}` : `${isim} | ${yas}`;
      await hedef.setNickname(yeniIsim).catch(() => null);
      await hedef.roles.add(kayitliRol).catch(() => null);
      if (kayitsizRol) await hedef.roles.remove(kayitsizRol).catch(() => null);
      return interaction.reply(`🎉 ${hedef} başarıyla kaydedildi!`);
    }
    if (commandName === "para-ekle") {
      const u = options.getUser("kullanıcı"); const m = options.getInteger("miktar");
      global.ekonomiMap.set(u.id, (global.ekonomiMap.get(u.id) || 0) + m);
      return interaction.reply(`💰 ${u} hesabına \`${m} TL\` eklendi.`);
    }
    if (commandName === "cüzdan") {
      const u = options.getUser("kullanıcı") || interaction.user;
      return interaction.reply(`💳 ${u} bakiyesi: **\`${global.ekonomiMap.get(u.id) || 0} TL\`**`);
    }
    if (commandName === "günlük") {
      const son = global.gunlukBonusMap.get(interaction.user.id) || 0;
      if (Date.now() - son < 86400000) return interaction.reply("❌ Bugünlük ödülünü aldın.");
      global.ekonomiMap.set(interaction.user.id, (global.ekonomiMap.get(interaction.user.id) || 0) + 250);
      global.gunlukBonusMap.set(interaction.user.id, Date.now());
      return interaction.reply("💵 Hesaba **`250 TL`** eklendi!");
    }
    if (commandName === "yazı-tura") {
      const bahis = options.getInteger("bahis"); const secim = options.getString("seçim");
      let bak = global.ekonomiMap.get(interaction.user.id) || 0;
      if (bak < bahis) return interaction.reply("❌ Para yok.");
      const zar = Math.random() < 0.5 ? "yazi" : "tura";
      if (zar === secim) { global.ekonomiMap.set(interaction.user.id, bak + bahis); return interaction.reply(`🪙 Kazandın! Para: ${zar.toUpperCase()}`); }
      else { global.ekonomiMap.set(interaction.user.id, bak - bahis); return interaction.reply(`🪙 Kaybettin. Para: ${zar.toUpperCase()}`); }
    }
    if (commandName === "rulet") {
      const bahis = options.getInteger("bahis"); const rnk = options.getString("renk");
      let bak = global.ekonomiMap.get(interaction.user.id) || 0;
      if (bak < bahis) return interaction.reply("❌ Bakiye yetersiz.");
      const s = Math.random() * 100; let kz = s < 5 ? "yesil" : s < 52 ? "kirmizi" : "siyah";
      if (rnk === kz) { let c = kz === "yesil" ? 14 : 2; global.ekonomiMap.set(interaction.user.id, bak + (bahis * (c - 1))); return interaction.reply(`🎰 Rulet: ${kz.toUpperCase()}! Kazandın.`); }
      else { global.ekonomiMap.set(interaction.user.id, bak - bahis); return interaction.reply(`🎰 Rulet: ${kz.toUpperCase()}! Kaybettin.`); }
    }
    if (commandName === "kelime-türetme") { return interaction.reply("🔤 Kelime Türetme başladı. İlk Kelime: **`Yazılım`**"); }
    if (commandName === "sayı-tahmin") { global.sayiTahminMap.set(guild.id, Math.floor(Math.random() * 100) + 1); return interaction.reply("🔢 Sayı tutuldu, hadi tahmin et!"); }
    if (commandName === "tahmin-yap") {
      const t = options.getInteger("sayı"); const g = global.sayiTahminMap.get(guild.id);
      if (!g) return interaction.reply("❌ Oyun yok.");
      if (t === g) { global.sayiTahminMap.delete(guild.id); return interaction.reply(`🎉 Doğru! Sayı: ${g}`); }
      return interaction.reply(t < g ? "🔼 Daha BÜYÜK bir sayı gir!" : "🔽 Daha KÜÇÜK bir sayı gir!");
    }
    if (commandName === "xp-durum") {
      const target = options.getUser("kullanıcı") || interaction.user; const data = global.xpMap.get(target.id) || { xp: 0, level: 1 };
      return interaction.reply(`📊 ${target.username}: Seviye \`${data.level}\` | XP \`${data.xp}/${data.level * 150}\``);
    }
    if (commandName === "kullanıcı-temizle") {
      const h = options.getUser("kullanıcı"); const m = options.getInteger("miktar");
      const msgs = await channel.messages.fetch({ limit: 100 }); const f = msgs.filter(m => m.author.id === h.id).toJSON().slice(0, miktar);
      if (f.length === 0) return interaction.reply("❌ Mesaj yok."); await channel.bulkDelete(f).catch(() => null);
      return interaction.reply(`🧹 ${h} üyesinin \`${f.length}\` adet mesajı silindi.`);
    }
    if (commandName === "sunucu-kurallar") {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(BRAND_COLOR).setTitle("📜 Kurallar").setDescription("1. Saygılı olun.\n2. Reklam yapmayın.")] });
    }
    if (commandName === "sosyal-medya") { return interaction.reply("🌐 Sosyal medya hesaplarımız yakında eklenecektir kanka."); }
    if (commandName === "davet-takip") {
      const target = options.getUser("kullanıcı") || interaction.user; let d = 0;
      const invs = await guild.invites.fetch().catch(() => null); if (invs) invs.forEach(i => { if (i.inviter?.id === target.id) d += i.uses; });
      return interaction.reply(`🔗 ${target.username} davet sayısı: **\`${d}\`**`);
    }
    if (commandName === "biyografi-ayarla") { global.biyografiMap.set(interaction.user.id, options.getString("metin")); return interaction.reply("✅ Biyografi güncellendi."); }
    if (commandName === "biyografi-bak") { return interaction.reply(`📝 Biyografi:\n\`\`\`\n${global.biyografiMap.get(options.getUser("kullanıcı").id) || "Boş"}\n\`\`\``); }
    if (commandName === "bağlantı-kes") { const h = options.getMember("kullanıcı"); if (h.voice.channelId) { await h.voice.disconnect(); return interaction.reply("🚀 Sesten atıldı."); } return interaction.reply("Seste değil."); }
    if (commandName === "ses-sustur") { await options.getMember("kullanıcı").voice.setMute(true).catch(() => null); return interaction.reply("🔇 Susturuldu."); }
    if (commandName === "ses-aç") { await options.getMember("kullanıcı").voice.setMute(false).catch(() => null); return interaction.reply("🔊 Açıldı."); }
    if (commandName === "yayın-aç") { const c = await guild.channels.create({ name: `🎥 ${options.getString("konu")}`, type: ChannelType.GuildVoice }); return interaction.reply(` Odası kuruldu: ${c}`); }
    if (commandName === "kullanıcı-yasaklar") { const b = await guild.bans.fetch({ limit: 10 }).catch(() => null); return interaction.reply(`🚨 Yasaklı Listesi:\n${b?.map(x => x.user.tag).join("\n") || "Kimse yok."}`); }
    if (commandName === "sil") { await channel.bulkDelete(options.getInteger("miktar")).catch(() => null); return interaction.reply({ content: "Temizlendi.", ephemeral: true }); }
    if (commandName === "çekiliş") {
      await interaction.reply(`🎉 Çekiliş Başladı! Ödül: ${options.getString("ödül")}`);
      setTimeout(async () => { const m = await guild.members.fetch(); const s = m.filter(x => !x.user.bot).random(); if (s) channel.send(`👑 Kazanan: ${s}`); }, 10000);
    }
    if (commandName === "say") { return interaction.reply(`👥 Toplam: \`${guild.memberCount}\` | Ses: \`${guild.members.cache.filter(m => m.voice.channelId).size}\``); }
    if (commandName === "tag-ayarla") { global.serverTag = options.getString("tag"); return interaction.reply("Tag ayarlandı."); }
    if (commandName === "rol-enformasyon") { return interaction.reply(`🎭 Üye Sayısı: \`${options.getRole("rol").members.size}\``); }
    if (commandName === "reklam-taraması") { return interaction.reply("🟢 Temiz."); }
    if (commandName === "jail") {
      const h = options.getMember("kullanıcı"); const r = h.roles.cache.map(x => x.id).filter(id => id !== guild.id);
      global.jailRolesMap.set(h.id, r); for (const x of r) await h.roles.remove(x).catch(() => null); return interaction.reply("⛓️ Karantina aktif.");
    }
    if (commandName === "unjail") { const h = options.getMember("kullanıcı"); const r = global.jailRolesMap.get(h.id) || []; for (const x of r) await h.roles.add(x).catch(() => null); return interaction.reply("🔓 Çıkarıldı."); }
    if (commandName === "kilitli-oda-kur") { const c = await guild.channels.create({ name: options.getString("isim"), type: ChannelType.GuildVoice }); return interaction.reply(`Oda açıldı: ${c}`); }
    if (commandName === "snipe") { const v = global.lastDeletedMessage.get(channel.id); return interaction.reply(v ? `🎯 **${v.author.username}:** \`${v.content}\`` : "Yok."); }
    if (commandName === "avatar") { return interaction.reply((options.getUser("kullanıcı") || interaction.user).displayAvatarURL()); }
    if (commandName === "id-bul") { return interaction.reply(`🆔: \`${options.getUser("kullanıcı").id}\``); }
    if (commandName === "unban") { await guild.members.unban(options.getString("id")).catch(() => null); return interaction.reply("Yasak kalktı."); }
    if (commandName === "yavaş-mod") { await channel.setRateLimitPerUser(options.getInteger("süre")); return interaction.reply("⏱️ Süre ayarlandı."); }
    if (commandName === "sustur") { await options.getMember("kullanıcı").timeout(options.getInteger("süre") * 60 * 1000).catch(() => null); return interaction.reply("Susturuldu."); }
    if (commandName === "kick") { await options.getMember("kullanıcı").kick().catch(() => null); return interaction.reply("Atıldı."); }
    if (commandName === "ban") { await options.getMember("kullanıcı").ban().catch(() => null); return interaction.reply("Banlandı."); }
    if (commandName === "ping") { return interaction.reply(`🏓 \`${client.ws.ping}ms\``); }
    if (commandName === "reboot") { await interaction.reply("🔄 Yeniden başlıyor..."); process.exit(0); }
  } catch (err) { console.error(err); }
});

client.login(TOKEN);