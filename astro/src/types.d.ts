import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { HTMLAttributes, ImageMetadata } from 'astro/types';

export interface Post {
  /** Unique ID identifying the post. */
  id: string;
  /** Locale of the post content. */
  locale: 'en' | 'da';
  /** URL-friendly slug derived from the post name. */
  slug: string;
  /** Fully resolved permalink, computed from the configured pattern. */
  permalink: string;

  publishDate: Date;
  updateDate?: Date;

  title: string;
  /** Optional summary of post content. */
  excerpt?: string;
  image?: ImageMetadata | string;

  category?: Taxonomy;
  tags?: Taxonomy[];
  author?: string;
  coauthor?: string;
  reviewers?: string[];

  metadata?: MetaData;

  draft?: boolean;

  /** Rendered Astro component factory for the post body. */
  Content?: AstroComponentFactory;

  /** Estimated reading time in minutes. */
  readingTime?: number;
}

export interface Profile {
  /** Unique ID identifying the profile (file stem). */
  id: string;
  name: string;
  bio?: string;
  image?: ImageMetadata | string;
  github?: string;
  linkedin?: string;
  website?: string;
}

export interface EventLocation {
  venue?: string;
  address?: string;
  mapurl?: string;
}

export interface EventSignup {
  signupurl: string;
  embeddedTallyURL?: string;
  caption?: string;
  icon?: string;
  repeat?: boolean;
}

export interface EventOccurrence {
  date: Date | string;
  time?: string;
  duration?: string;
}

export interface Event {
  /** Unique ID identifying the event. */
  id: string;
  /** Locale of the event content. */
  locale: 'en' | 'da';
  /** URL-friendly slug derived from the event ID. */
  slug: string;
  title: string;
  sortorder?: number;
  dates: EventOccurrence[];
  location: string | EventLocation;
  excerpt?: string;
  image?: ImageMetadata | string;
  signup?: EventSignup;
  metadata?: MetaData;
  draft?: boolean;
  Content?: AstroComponentFactory;
}

export interface Service {
  /** Unique ID identifying the service. */
  id: string;
  /** Locale of the service content. */
  locale: 'en' | 'da';
  /** URL-friendly slug derived from the service ID. */
  slug: string;
  title: string;
  excerpt?: string;
  image?: ImageMetadata | string;
  cta?: ServiceCta;
  order?: number;
  metadata?: MetaData;
  draft?: boolean;
  Content?: AstroComponentFactory;
}

export interface ServiceCta {
  ctaurl: string;
  caption?: string;
  icon?: string;
  repeat?: boolean;
}

export type ProjectStatus = 'mature' | 'beta' | 'lab' | 'explore' | 'not-started';

export interface ProjectSlack {
  channel?: string;
  url?: string;
}

export interface ProjectGithub {
  repositories: string[];
}

export interface ProjectReference {
  name: string;
  url: string;
}

export interface ProjectParticipants {
  leads?: string[];
  contributors?: string[];
}

export interface Project {
  id: string;
  locale: 'en' | 'da';
  slug: string;
  permalink: string;
  publishDate: Date;
  updateDate?: Date;
  title: string;
  excerpt?: string;
  image?: ImageMetadata | string;
  tags?: Taxonomy[];
  metadata?: MetaData;
  draft?: boolean;
  project: {
    status: ProjectStatus;
    order?: number;
    tags?: Taxonomy[];
    slack?: ProjectSlack;
    github?: ProjectGithub;
    references?: ProjectReference[];
    participants?: ProjectParticipants;
  };
  Content?: AstroComponentFactory;
}

export type ProfileRelationRole = 'author' | 'coauthor' | 'reviewer' | 'lead' | 'contributor';

export type ProfileRelationSourceType = 'post' | 'event' | 'project';

export interface ProfileRelation {
  role: ProfileRelationRole;
  sourceType: ProfileRelationSourceType;
  sourceId: string;
  title: string;
  permalink: string;
}

export interface ResolvedProfileReference {
  id: string;
  profile?: Profile;
}

export interface Taxonomy {
  slug: string;
  title: string;
}

export interface MetaData {
  title?: string;
  ignoreTitleTemplate?: boolean;

  canonical?: string;

  robots?: MetaDataRobots;

  description?: string;

  openGraph?: MetaDataOpenGraph;
  twitter?: MetaDataTwitter;
}

export interface MetaDataRobots {
  index?: boolean;
  follow?: boolean;
}

export interface MetaDataImage {
  url: string;
  width?: number;
  height?: number;
}

export interface MetaDataOpenGraph {
  url?: string;
  siteName?: string;
  images?: Array<MetaDataImage>;
  locale?: string;
  type?: string;
}

export interface MetaDataTwitter {
  handle?: string;
  site?: string;
  cardType?: string;
}

export interface Image {
  src: string;
  alt?: string;
}

export interface Widget {
  id?: string;
  isDark?: boolean;
  bg?: string;
  classes?: Record<string, string | Record<string, string>>;
}

export interface Headline {
  title?: string;
  subtitle?: string;
  tagline?: string;
  classes?: Record<string, string>;
}

interface TeamMember {
  name?: string;
  job?: string;
  image?: Image;
  socials?: Array<Social>;
  description?: string;
  classes?: Record<string, string>;
}

interface Social {
  icon?: string;
  href?: string;
}

export interface Stat {
  amount?: number | string;
  title?: string;
  icon?: string;
}

export interface Item {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  classes?: Record<string, string>;
  callToAction?: CallToAction;
  image?: Image;
}

export interface Price {
  title?: string;
  subtitle?: string;
  description?: string;
  price?: number | string;
  period?: string;
  items?: Array<Item>;
  callToAction?: CallToAction;
  hasRibbon?: boolean;
  ribbonTitle?: string;
}

export interface Testimonial {
  title?: string;
  testimonial?: string;
  name?: string;
  job?: string;
  image?: string | unknown;
}

export interface Input {
  type: HTMLInputTypeAttribute;
  name: string;
  label?: string;
  autocomplete?: string;
  placeholder?: string;
}

export interface Textarea {
  label?: string;
  name?: string;
  placeholder?: string;
  rows?: number;
}

export interface Disclaimer {
  label?: string;
}

// COMPONENTS
export interface CallToAction extends Omit<HTMLAttributes<'a'>, 'slot'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
  text?: string;
  icon?: string;
  classes?: Record<string, string>;
  type?: 'button' | 'submit' | 'reset';
}

export interface Collapse {
  iconUp?: string;
  iconDown?: string;
  items?: Array<Item>;
  columns?: number;
  classes?: Record<string, string>;
}

export interface Form {
  inputs?: Array<Input>;
  textarea?: Textarea;
  disclaimer?: Disclaimer;
  button?: string;
  description?: string;
}

// WIDGETS
export interface Hero extends Omit<Headline, 'classes'>, Omit<Widget, 'isDark' | 'classes'> {
  content?: string;
  actions?: string | CallToAction[];
  image?: string | unknown;
}

export interface HeroX extends Hero {
  imageCaption?: string;
  overlayActions?: HeroXOverlayAction[];
}

export interface HeroXOverlayAction extends CallToAction {
  position?: 'left' | 'right';
}

export interface Team extends Omit<Headline, 'classes'>, Widget {
  team?: Array<TeamMember>;
}

export interface Stats extends Omit<Headline, 'classes'>, Widget {
  stats?: Array<Stat>;
}

export interface Pricing extends Omit<Headline, 'classes'>, Widget {
  prices?: Array<Price>;
}

export interface Testimonials extends Omit<Headline, 'classes'>, Widget {
  testimonials?: Array<Testimonial>;
  callToAction?: CallToAction;
}

export interface Brands extends Omit<Headline, 'classes'>, Widget {
  icons?: Array<string>;
  images?: Array<Image>;
}

export interface Features extends Omit<Headline, 'classes'>, Widget {
  image?: string | unknown;
  items?: Array<Item>;
  columns?: number;
  defaultIcon?: string;
  isBeforeContent?: boolean;
  isAfterContent?: boolean;
}

export interface Faqs extends Omit<Headline, 'classes'>, Widget {
  items?: Array<Item>;
  columns?: number;
}

export interface Steps extends Omit<Headline, 'classes'>, Widget {
  items?: Array<Item>;
  callToAction?: string | CallToAction;
  image?: string | Image;
  isReversed?: boolean;
}

export interface Content extends Omit<Headline, 'classes'>, Widget {
  content?: string;
  image?: string | unknown;
  items?: Array<Item>;
  columns?: number;
  isReversed?: boolean;
  isAfterContent?: boolean;
  callToAction?: CallToAction;
}

export interface Contact extends Omit<Headline, 'classes'>, Form, Widget {}
