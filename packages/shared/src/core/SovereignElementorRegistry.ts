export interface GameWidgetAttributes {
  hazardIndex: number;
  friction: number;
  walkable: boolean;
  voltageLoad: number;
}

export interface GameWidgetDefinition {
  id: string;
  type: 'accordion' | 'alert' | 'card' | 'shield';
  name: string;
  description: string;
  defaultAttributes: GameWidgetAttributes;
}

export interface GameWidgetInstance {
  instanceId: string;
  widgetId: string;
  type: 'accordion' | 'alert' | 'card' | 'shield';
  name: string;
  attributes: GameWidgetAttributes;
  hexCoord: string;
}

export const WIDGET_CATALOG: GameWidgetDefinition[] = [
  {
    id: 'w_accordion_hex',
    type: 'accordion',
    name: 'Accordion Hexagon Plate',
    description: 'Collapsible hexagonal plate detailing biome metrics.',
    defaultAttributes: {
      hazardIndex: 0.45,
      friction: 1.0,
      walkable: true,
      voltageLoad: 15
    }
  },
  {
    id: 'w_alert_plate',
    type: 'alert',
    name: 'Bootstrap Alert Plate',
    description: 'Alert layout block displaying hazard alarms.',
    defaultAttributes: {
      hazardIndex: 0.90,
      friction: 1.5,
      walkable: false,
      voltageLoad: 45
    }
  },
  {
    id: 'w_holo_card',
    type: 'card',
    name: 'Holographic Info Card',
    description: 'Card display showing grid voltage load readings.',
    defaultAttributes: {
      hazardIndex: 0.15,
      friction: 0.8,
      walkable: true,
      voltageLoad: 8
    }
  },
  {
    id: 'w_shield_overload',
    type: 'shield',
    name: 'Shield Overload Plate',
    description: 'Dynamic shield block absorbing current anomalies.',
    defaultAttributes: {
      hazardIndex: 0.60,
      friction: 1.2,
      walkable: true,
      voltageLoad: 25
    }
  }
];

export class SovereignElementorRegistry {
  /**
   * Returns all available modular widgets in the library catalog.
   */
  public static getCatalog(): GameWidgetDefinition[] {
    return WIDGET_CATALOG;
  }

  /**
   * Instantiates a widget with custom attributes and positioning coordinate.
   */
  public static instantiateWidget(
    widgetId: string,
    hexCoord: string,
    customAttrs?: Partial<GameWidgetAttributes>
  ): GameWidgetInstance {
    const definition = WIDGET_CATALOG.find(w => w.id === widgetId);
    if (!definition) {
      throw new Error(`Widget definition ${widgetId} not found in catalog.`);
    }

    const attributes: GameWidgetAttributes = {
      ...definition.defaultAttributes,
      ...customAttrs
    };

    return {
      instanceId: `inst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      widgetId,
      type: definition.type,
      name: definition.name,
      attributes,
      hexCoord
    };
  }

  /**
   * Serializes a widget instance into a stringified JSON schema configuration.
   */
  public static serialize(instance: GameWidgetInstance): string {
    return JSON.stringify(instance, null, 2);
  }

  /**
   * Deserializes a stringified schema configuration back to a widget instance.
   */
  public static deserialize(serialized: string): GameWidgetInstance {
    const parsed = JSON.parse(serialized);
    if (!parsed.instanceId || !parsed.widgetId || !parsed.attributes) {
      throw new Error("Invalid serialized widget schema.");
    }
    return parsed as GameWidgetInstance;
  }
}
