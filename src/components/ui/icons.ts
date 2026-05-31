import {
  IconToolsKitchen2, IconShoppingCart, IconCar, IconHome, IconBulb, IconDeviceTv,
  IconPlane, IconShoppingBag, IconHeartbeat, IconDots, IconCoffee, IconBeer, IconPizza,
  IconGasStation, IconBus, IconTrain, IconBike, IconMovie, IconMusic, IconGift, IconPaw,
  IconBook, IconBriefcase, IconSchool, IconWifi, IconBolt, IconDroplet, IconFlame,
  IconPhone, IconPill, IconBarbell, IconShirt, IconBuildingStore, IconTicket, IconCake,
  IconReceipt, IconCash, IconCreditCard, IconWallet, IconHeart,
  type Icon,
} from '@tabler/icons-react'

export interface IconEntry {
  /** Stable key stored on the category (Tabler name without the `ti-` prefix). */
  key: string
  /** Search keywords. */
  label: string
  Icon: Icon
}

/** Curated set of expense-relevant icons for the picker. */
export const ICON_REGISTRY: IconEntry[] = [
  { key: 'tools-kitchen-2', label: 'food dining restaurant kitchen', Icon: IconToolsKitchen2 },
  { key: 'coffee', label: 'coffee cafe drink', Icon: IconCoffee },
  { key: 'beer', label: 'beer drinks bar alcohol', Icon: IconBeer },
  { key: 'pizza', label: 'pizza food takeout', Icon: IconPizza },
  { key: 'cake', label: 'cake dessert birthday', Icon: IconCake },
  { key: 'shopping-cart', label: 'groceries supermarket', Icon: IconShoppingCart },
  { key: 'shopping-bag', label: 'shopping retail', Icon: IconShoppingBag },
  { key: 'building-store', label: 'store shop', Icon: IconBuildingStore },
  { key: 'shirt', label: 'clothes apparel fashion', Icon: IconShirt },
  { key: 'car', label: 'car transport ride taxi', Icon: IconCar },
  { key: 'bus', label: 'bus transit', Icon: IconBus },
  { key: 'train', label: 'train metro mrt', Icon: IconTrain },
  { key: 'bike', label: 'bike cycling', Icon: IconBike },
  { key: 'gas-station', label: 'fuel petrol gas', Icon: IconGasStation },
  { key: 'plane', label: 'travel flight holiday', Icon: IconPlane },
  { key: 'ticket', label: 'tickets events', Icon: IconTicket },
  { key: 'home', label: 'rent home house', Icon: IconHome },
  { key: 'bulb', label: 'utilities electricity power', Icon: IconBulb },
  { key: 'bolt', label: 'electricity power energy', Icon: IconBolt },
  { key: 'droplet', label: 'water bill utilities', Icon: IconDroplet },
  { key: 'flame', label: 'gas heating', Icon: IconFlame },
  { key: 'wifi', label: 'internet wifi broadband', Icon: IconWifi },
  { key: 'phone', label: 'phone mobile bill', Icon: IconPhone },
  { key: 'device-tv', label: 'entertainment tv streaming', Icon: IconDeviceTv },
  { key: 'movie', label: 'movie cinema film', Icon: IconMovie },
  { key: 'music', label: 'music concert spotify', Icon: IconMusic },
  { key: 'book', label: 'books education reading', Icon: IconBook },
  { key: 'school', label: 'school tuition education', Icon: IconSchool },
  { key: 'briefcase', label: 'work business', Icon: IconBriefcase },
  { key: 'heartbeat', label: 'health medical', Icon: IconHeartbeat },
  { key: 'pill', label: 'pharmacy medicine health', Icon: IconPill },
  { key: 'barbell', label: 'gym fitness sport', Icon: IconBarbell },
  { key: 'paw', label: 'pet animal', Icon: IconPaw },
  { key: 'gift', label: 'gift present', Icon: IconGift },
  { key: 'heart', label: 'donation charity love', Icon: IconHeart },
  { key: 'receipt', label: 'receipt bill tax', Icon: IconReceipt },
  { key: 'cash', label: 'cash money', Icon: IconCash },
  { key: 'credit-card', label: 'card payment', Icon: IconCreditCard },
  { key: 'wallet', label: 'wallet budget', Icon: IconWallet },
  { key: 'dots', label: 'other misc', Icon: IconDots },
]

const ICON_MAP = new Map(ICON_REGISTRY.map((e) => [e.key, e.Icon]))

/** Resolve a category's stored icon value (`ti-foo` or `foo`) to a Tabler component, or null. */
export function resolveCategoryIcon(name?: string | null): Icon | null {
  if (!name) return null
  return ICON_MAP.get(name.replace(/^ti-/, '')) ?? null
}
