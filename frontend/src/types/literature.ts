export interface PubmedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pub_date: string;
  abstract: string;
  doi: string;
}

export interface BiorxivArticle {
  doi: string;
  title: string;
  authors: string;
  pub_date: string;
  abstract: string;
}

export interface OpenalexArticle {
  id: string;
  title: string;
  authors: string;
  pub_date: string;
  abstract: string;
  doi: string;
}

export interface LiteratureData {
  query: string;
  pubmed: PubmedArticle[];
  biorxiv: BiorxivArticle[];
  openalex: OpenalexArticle[];
}
