export const config = {
  runtime: 'edge'
}

// Mapping des bannières québécoises avec produits typiques et prix réalistes
// Dataset enrichi: ~40-70 produits par bannière couvrant toutes catégories
const STORE_MAPPING = {
  'IGA': { 
    keywords: ['iga', 'sobeys'],
    products: [
      // Produits laitiers & oeufs
      { name: 'lait 2% 2l', price: 4.99, format: '2L' },
      { name: 'lait 3.25% 4l', price: 8.99, format: '4L' },
      { name: 'lait écrémé 1l', price: 2.79, format: '1L' },
      { name: 'oeufs gros calibre', price: 4.29, format: '12 unités' },
      { name: 'oeufs blancs extra-gros', price: 4.99, format: '12 unités' },
      { name: 'beurre salé', price: 5.99, format: '454g' },
      { name: 'beurre non salé', price: 5.99, format: '454g' },
      { name: 'yogourt nature', price: 3.99, format: '750g' },
      { name: 'yogourt grec vanille', price: 4.99, format: '750g' },
      { name: 'crème 15%', price: 3.49, format: '473ml' },
      { name: 'crème 35%', price: 4.49, format: '473ml' },
      { name: 'fromage cheddar fort', price: 7.99, format: '400g' },
      { name: 'fromage mozzarella râpé', price: 6.99, format: '320g' },
      { name: 'fromage brie', price: 8.99, format: '300g' },
      
      // Boulangerie
      { name: 'pain tranché blanc', price: 2.49, format: '675g' },
      { name: 'pain multigrains', price: 3.49, format: '675g' },
      { name: 'bagels nature', price: 3.99, format: '6 unités' },
      { name: 'croissants', price: 4.99, format: '6 unités' },
      
      // Viandes & poissons
      { name: 'poulet poitrine', price: 12.99, format: 'kg' },
      { name: 'poulet cuisses', price: 7.99, format: 'kg' },
      { name: 'poulet entier', price: 5.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.99, format: 'kg' },
      { name: 'boeuf haché maigre', price: 10.99, format: 'kg' },
      { name: 'porc côtelettes', price: 9.99, format: 'kg' },
      { name: 'porc rôti épaule', price: 7.99, format: 'kg' },
      { name: 'saumon atlantique', price: 14.99, format: 'kg' },
      { name: 'tilapia filets', price: 12.99, format: 'kg' },
      { name: 'crevettes décortiquées', price: 18.99, format: '454g' },
      
      // Fruits
      { name: 'pommes gala', price: 3.99, format: 'kg' },
      { name: 'pommes honeycrisp', price: 5.99, format: 'kg' },
      { name: 'bananes', price: 1.49, format: 'kg' },
      { name: 'oranges', price: 3.49, format: '2 lb' },
      { name: 'fraises', price: 4.99, format: '454g' },
      { name: 'bleuets', price: 5.99, format: '340g' },
      { name: 'raisins rouges', price: 4.99, format: 'kg' },
      { name: 'mangues', price: 2.49, format: 'unité' },
      
      // Légumes
      { name: 'carottes', price: 2.99, format: '2 lb' },
      { name: 'brocoli', price: 3.49, format: 'unité' },
      { name: 'laitue romaine', price: 2.49, format: 'unité' },
      { name: 'laitue iceberg', price: 2.29, format: 'unité' },
      { name: 'tomates cerises', price: 3.99, format: '454g' },
      { name: 'tomates en grappe', price: 4.99, format: 'kg' },
      { name: 'concombres anglais', price: 2.49, format: 'unité' },
      { name: 'poivrons rouges', price: 5.99, format: 'kg' },
      { name: 'oignons jaunes', price: 1.99, format: '3 lb' },
      { name: 'pommes de terre', price: 4.99, format: '5 lb' },
      
      // Épicerie sèche
      { name: 'pâtes penne', price: 2.49, format: '500g' },
      { name: 'riz basmati', price: 9.99, format: '5kg' },
      { name: 'farine tout usage', price: 5.99, format: '2.5kg' },
      { name: 'sucre blanc', price: 3.99, format: '2kg' },
      { name: 'huile d\'olive', price: 12.99, format: '1L' },
      { name: 'sauce tomate', price: 2.99, format: '680ml' },
      { name: 'céréales corn flakes', price: 5.49, format: '525g' },
      { name: 'confiture fraises', price: 4.49, format: '500ml' },
      
      // Boissons
      { name: 'jus d\'orange tropicana', price: 4.49, format: '1.75L' },
      { name: 'jus de pomme', price: 3.49, format: '1.89L' },
      { name: 'eau embouteillée', price: 3.99, format: '12x500ml' },
      { name: 'café moulu', price: 11.99, format: '925g' },
      { name: 'thé vert', price: 5.99, format: '20 sachets' },
      
      // Produits ménagers
      { name: 'papier toilette 12 rouleaux', price: 9.99, format: '12 unités' },
      { name: 'essuie-tout 6 rouleaux', price: 11.99, format: '6 unités' },
      { name: 'détergent à lessive', price: 12.99, format: '2.95L' },
      { name: 'savon à vaisselle', price: 3.99, format: '740ml' },
    ]
  },
  'Walmart': { 
    keywords: ['walmart'],
    products: [
      // Produits laitiers & oeufs
      { name: 'lait 2% 2l', price: 4.47, format: '2L' },
      { name: 'lait 3.25% 4l', price: 8.47, format: '4L' },
      { name: 'lait écrémé 1l', price: 2.47, format: '1L' },
      { name: 'oeufs gros calibre', price: 3.97, format: '12 unités' },
      { name: 'oeufs blancs extra-gros', price: 4.47, format: '12 unités' },
      { name: 'beurre salé', price: 5.47, format: '454g' },
      { name: 'beurre non salé', price: 5.47, format: '454g' },
      { name: 'yogourt nature', price: 3.47, format: '750g' },
      { name: 'yogourt grec vanille', price: 4.47, format: '750g' },
      { name: 'crème 15%', price: 3.17, format: '473ml' },
      { name: 'crème 35%', price: 4.17, format: '473ml' },
      { name: 'fromage cheddar fort', price: 7.47, format: '400g' },
      { name: 'fromage mozzarella râpé', price: 6.47, format: '320g' },
      
      // Boulangerie
      { name: 'pain tranché blanc', price: 1.97, format: '675g' },
      { name: 'pain multigrains', price: 2.97, format: '675g' },
      { name: 'bagels nature', price: 3.47, format: '6 unités' },
      { name: 'tortillas', price: 3.97, format: '10 unités' },
      
      // Viandes & poissons
      { name: 'poulet poitrine', price: 11.97, format: 'kg' },
      { name: 'poulet cuisses', price: 7.47, format: 'kg' },
      { name: 'poulet entier', price: 5.47, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 7.97, format: 'kg' },
      { name: 'boeuf haché maigre', price: 9.97, format: 'kg' },
      { name: 'porc côtelettes', price: 8.97, format: 'kg' },
      { name: 'saucisses italiennes', price: 6.97, format: '500g' },
      { name: 'tilapia filets', price: 11.97, format: 'kg' },
      
      // Fruits
      { name: 'pommes gala', price: 3.47, format: 'kg' },
      { name: 'pommes red delicious', price: 3.27, format: 'kg' },
      { name: 'bananes', price: 1.27, format: 'kg' },
      { name: 'oranges', price: 2.97, format: '2 lb' },
      { name: 'fraises', price: 4.47, format: '454g' },
      { name: 'raisins verts', price: 4.47, format: 'kg' },
      { name: 'melon d\'eau', price: 4.97, format: 'unité' },
      
      // Légumes
      { name: 'carottes', price: 2.47, format: '2 lb' },
      { name: 'brocoli', price: 2.97, format: 'unité' },
      { name: 'laitue romaine', price: 1.97, format: 'unité' },
      { name: 'laitue iceberg', price: 1.77, format: 'unité' },
      { name: 'tomates cerises', price: 3.47, format: '454g' },
      { name: 'concombres', price: 1.97, format: 'unité' },
      { name: 'poivrons verts', price: 3.97, format: 'kg' },
      { name: 'oignons jaunes', price: 1.47, format: '3 lb' },
      { name: 'pommes de terre', price: 4.47, format: '5 lb' },
      
      // Épicerie sèche
      { name: 'pâtes barilla', price: 1.97, format: '500g' },
      { name: 'céréales cheerios', price: 4.97, format: '430g' },
      { name: 'céréales special k', price: 5.47, format: '400g' },
      { name: 'riz basmati', price: 8.97, format: '5kg' },
      { name: 'farine tout usage', price: 4.97, format: '2.5kg' },
      { name: 'sucre blanc', price: 3.47, format: '2kg' },
      { name: 'huile végétale', price: 6.97, format: '1L' },
      { name: 'sauce tomate', price: 2.47, format: '680ml' },
      { name: 'beurre d\'arachide', price: 5.97, format: '1kg' },
      { name: 'confiture fraises', price: 3.97, format: '500ml' },
      
      // Boissons
      { name: 'jus d\'orange', price: 3.97, format: '1.75L' },
      { name: 'jus de pomme', price: 2.97, format: '1.89L' },
      { name: 'eau embouteillée', price: 2.97, format: '24x500ml' },
      { name: 'café moulu', price: 9.97, format: '925g' },
      { name: 'thé noir', price: 4.97, format: '20 sachets' },
      { name: 'cola', price: 4.97, format: '2L' },
      
      // Produits ménagers
      { name: 'papier toilette 12 rouleaux', price: 7.97, format: '12 unités' },
      { name: 'essuie-tout 6 rouleaux', price: 9.97, format: '6 unités' },
      { name: 'détergent à lessive', price: 11.97, format: '2.95L' },
      { name: 'savon à vaisselle', price: 2.97, format: '740ml' },
      { name: 'nettoyant multi-surfaces', price: 4.97, format: '1L' },
    ]
  },
  'Costco': { 
    keywords: ['costco'],
    products: [
  // Produits laitiers & oeufs (bulk)
      { name: 'lait 2% 4l', price: 7.99, format: '4L' },
  { name: 'lait 3.25% 4l', price: 7.99, format: '4L' },
  { name: 'oeufs gros calibre', price: 7.49, format: '2x12 unités' },
  { name: 'beurre salé', price: 10.99, format: '4x454g' },
  { name: 'yogourt grec', price: 8.99, format: '2x750g' },
  { name: 'fromage cheddar fort', price: 14.99, format: '900g' },
  { name: 'fromage mozzarella', price: 12.99, format: '900g' },
      
  // Boulangerie (bulk)
  { name: 'pain bagels', price: 4.99, format: '6 unités' },
  { name: 'pain hot dog', price: 5.99, format: '12 unités' },
  { name: 'tortillas', price: 6.99, format: '20 unités' },
  { name: 'muffins', price: 7.99, format: '12 unités' },
      
  // Viandes & poissons (bulk)
  { name: 'poulet poitrine', price: 10.99, format: 'kg' },
  { name: 'poulet cuisses', price: 6.99, format: 'kg' },
  { name: 'boeuf haché mi-maigre', price: 6.99, format: 'kg' },
  { name: 'porc côtelettes', price: 8.49, format: 'kg' },
  { name: 'saumon atlantique', price: 12.99, format: 'kg' },
  { name: 'crevettes', price: 24.99, format: '1kg' },
  { name: 'bacon', price: 16.99, format: '1kg' },
      
  // Fruits (bulk)
  { name: 'pommes gala', price: 7.99, format: '3kg' },
  { name: 'bananes biologiques', price: 2.99, format: '2 lb' },
  { name: 'oranges', price: 8.99, format: '5 lb' },
  { name: 'fraises', price: 8.99, format: '2 lb' },
  { name: 'bleuets', price: 9.99, format: '1 lb' },
  { name: 'raisins', price: 9.99, format: '2 lb' },
      
  // Légumes (bulk)
  { name: 'carottes', price: 4.99, format: '5 lb' },
  { name: 'brocoli', price: 6.99, format: '4 têtes' },
  { name: 'laitue romaine', price: 5.99, format: '3 unités' },
  { name: 'tomates', price: 7.99, format: '2 lb' },
  { name: 'poivrons', price: 8.99, format: '6 unités' },
  { name: 'oignons', price: 5.99, format: '5 lb' },
  { name: 'pommes de terre', price: 7.99, format: '10 lb' },
      
  // Épicerie sèche (bulk)
  { name: 'pâtes', price: 8.99, format: '2kg' },
  { name: 'riz basmati', price: 16.99, format: '10kg' },
  { name: 'farine', price: 12.99, format: '10kg' },
  { name: 'sucre', price: 9.99, format: '4kg' },
  { name: 'huile d\'olive extra vierge', price: 16.99, format: '3L' },
  { name: 'sauce tomate', price: 9.99, format: '6x680ml' },
  { name: 'céréales cheerios', price: 12.99, format: '2x1kg' },
  { name: 'beurre d\'arachide', price: 11.99, format: '2kg' },
  { name: 'confiture', price: 8.99, format: '2x500ml' },
      
  // Boissons (bulk)
  { name: 'jus d\'orange', price: 9.99, format: '2.5L' },
  { name: 'eau embouteillée', price: 3.99, format: '35x500ml' },
  { name: 'café grains kirkland', price: 19.99, format: '907g' },
  { name: 'thé vert', price: 12.99, format: '100 sachets' },
  { name: 'cola', price: 12.99, format: '12x355ml' },
      
  // Produits ménagers (bulk)
  { name: 'papier toilette 30 rouleaux', price: 24.99, format: '30 unités' },
  { name: 'essuie-tout 12 rouleaux', price: 19.99, format: '12 unités' },
  { name: 'détergent à lessive kirkland', price: 24.99, format: '5.73L' },
  { name: 'savon à vaisselle', price: 12.99, format: '3x740ml' },
  { name: 'sacs poubelle', price: 18.99, format: '200 unités' },
      
  // Surgelés & prêt-à-manger
  { name: 'pizza surgelée', price: 12.99, format: '3 unités' },
  { name: 'poulet rôti', price: 7.99, format: 'unité' },
  { name: 'lasagne', price: 14.99, format: '1.5kg' },
    ]
  },
  'Maxi': { 
    keywords: ['maxi', 'loblaws', 'provigo'],
    products: [
      // Produits laitiers & oeufs
      { name: 'lait 2% 2l', price: 4.79, format: '2L' },
      { name: 'lait 3.25% 4l', price: 8.79, format: '4L' },
      { name: 'lait écrémé 1l', price: 2.59, format: '1L' },
      { name: 'oeufs gros calibre', price: 4.49, format: '12 unités' },
      { name: 'oeufs bio', price: 5.99, format: '12 unités' },
      { name: 'beurre salé', price: 5.79, format: '454g' },
      { name: 'yogourt grec', price: 4.99, format: '750g' },
      { name: 'yogourt nature', price: 3.79, format: '750g' },
      { name: 'crème 35%', price: 4.29, format: '473ml' },
      { name: 'fromage mozzarella', price: 6.99, format: '400g' },
      { name: 'fromage cheddar', price: 7.49, format: '400g' },
      
      // Boulangerie
      { name: 'pain tranché blanc', price: 2.29, format: '675g' },
      { name: 'pain multigrains', price: 3.29, format: '675g' },
      { name: 'bagels sésame', price: 3.79, format: '6 unités' },
      { name: 'pains hamburger', price: 3.49, format: '8 unités' },
      
      // Viandes & poissons
      { name: 'poulet poitrine', price: 12.49, format: 'kg' },
      { name: 'poulet cuisses', price: 8.49, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.49, format: 'kg' },
      { name: 'porc côtelettes', price: 9.49, format: 'kg' },
      { name: 'saumon frais', price: 15.49, format: 'kg' },
      { name: 'crevettes', price: 17.99, format: '454g' },
      
      // Fruits
      { name: 'pommes gala', price: 3.79, format: 'kg' },
      { name: 'pommes cortland', price: 3.49, format: 'kg' },
      { name: 'bananes', price: 1.39, format: 'kg' },
      { name: 'oranges navel', price: 3.29, format: '2 lb' },
      { name: 'fraises du québec', price: 5.49, format: '454g' },
      { name: 'bleuets', price: 5.99, format: '340g' },
      { name: 'raisins', price: 4.79, format: 'kg' },
      
      // Légumes
      { name: 'carottes biologiques', price: 3.49, format: '2 lb' },
      { name: 'brocoli', price: 2.99, format: 'unité' },
      { name: 'laitue romaine', price: 2.49, format: 'unité' },
      { name: 'tomates cerises', price: 3.99, format: '454g' },
      { name: 'concombres', price: 2.29, format: 'unité' },
      { name: 'poivrons rouges', price: 5.79, format: 'kg' },
      { name: 'oignons', price: 1.79, format: '3 lb' },
      { name: 'pommes de terre', price: 4.79, format: '5 lb' },
      { name: 'champignons', price: 3.99, format: '227g' },
      
      // Épicerie sèche
      { name: 'pâtes penne', price: 2.29, format: '500g' },
      { name: 'riz basmati', price: 9.49, format: '5kg' },
      { name: 'farine', price: 5.49, format: '2.5kg' },
      { name: 'sucre', price: 3.79, format: '2kg' },
      { name: 'huile d\'olive', price: 11.99, format: '1L' },
      { name: 'sauce tomate', price: 2.79, format: '680ml' },
      { name: 'céréales spécial k', price: 5.99, format: '400g' },
      { name: 'confiture', price: 4.29, format: '500ml' },
      
      // Boissons
      { name: 'jus d\'orange', price: 4.29, format: '1.75L' },
      { name: 'jus de pomme', price: 3.29, format: '1.89L' },
      { name: 'eau embouteillée', price: 3.49, format: '12x500ml' },
      { name: 'café moulu', price: 10.99, format: '925g' },
      
      // Produits ménagers
      { name: 'papier toilette 12 rouleaux', price: 9.49, format: '12 unités' },
      { name: 'essuie-tout', price: 10.99, format: '6 rouleaux' },
      { name: 'détergent à lessive', price: 9.99, format: '2.95L' },
      { name: 'savon à vaisselle', price: 3.79, format: '740ml' },
      
      // Collations & surgelés
      { name: 'chips lays', price: 3.99, format: '235g' },
      { name: 'crème glacée', price: 4.99, format: '1.5L' },
      { name: 'pizza surgelée', price: 6.99, format: 'unité' },
    ]
  },
  'Super C': { 
    keywords: ['super c', 'super-c'],
    products: [
      // Produits laitiers & oeufs
      { name: 'lait 2% 2l', price: 4.29, format: '2L' },
      { name: 'lait 3.25% 4l', price: 7.99, format: '4L' },
      { name: 'lait écrémé 1l', price: 2.29, format: '1L' },
      { name: 'oeufs gros calibre', price: 3.79, format: '12 unités' },
      { name: 'beurre salé', price: 5.29, format: '454g' },
      { name: 'yogourt nature', price: 3.29, format: '750g' },
      { name: 'yogourt grec', price: 3.99, format: '750g' },
      { name: 'crème 15%', price: 2.99, format: '473ml' },
      { name: 'fromage cheddar', price: 5.99, format: '400g' },
      { name: 'fromage mozzarella', price: 5.49, format: '320g' },
      
      // Boulangerie
      { name: 'pain tranché blanc', price: 1.99, format: '675g' },
      { name: 'pain multigrains', price: 2.79, format: '675g' },
      { name: 'bagels', price: 2.99, format: '6 unités' },
      { name: 'tortillas', price: 3.49, format: '10 unités' },
      
      // Viandes & poissons
      { name: 'poulet poitrine', price: 11.49, format: 'kg' },
      { name: 'poulet cuisses', price: 6.99, format: 'kg' },
      { name: 'poulet entier', price: 4.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 7.49, format: 'kg' },
      { name: 'porc côtelettes', price: 8.49, format: 'kg' },
      { name: 'saucisses', price: 4.99, format: '500g' },
      { name: 'jambon tranché', price: 6.99, format: '500g' },
      { name: 'tilapia', price: 10.99, format: 'kg' },
      
      // Fruits
      { name: 'pommes gala', price: 2.99, format: 'kg' },
      { name: 'pommes mcintosh', price: 2.79, format: 'kg' },
      { name: 'bananes', price: 1.19, format: 'kg' },
      { name: 'oranges', price: 2.79, format: '2 lb' },
      { name: 'fraises', price: 3.99, format: '454g' },
      { name: 'raisins', price: 3.99, format: 'kg' },
      { name: 'cantaloup', price: 2.99, format: 'unité' },
      
      // Légumes
      { name: 'carottes', price: 2.29, format: '2 lb' },
      { name: 'brocoli', price: 2.49, format: 'unité' },
      { name: 'laitue iceberg', price: 1.79, format: 'unité' },
      { name: 'tomates', price: 3.49, format: 'kg' },
      { name: 'concombres', price: 0.99, format: 'unité' },
      { name: 'poivrons verts', price: 1.99, format: 'lb' },
      { name: 'poivrons rouges', price: 3.99, format: 'lb' },
      { name: 'oignons', price: 1.29, format: '3 lb' },
      { name: 'pommes de terre', price: 3.99, format: '5 lb' },
      { name: 'céleri', price: 2.49, format: 'unité' },
      
      // Épicerie sèche
      { name: 'pâtes', price: 1.79, format: '500g' },
      { name: 'riz', price: 7.99, format: '5kg' },
      { name: 'farine', price: 4.49, format: '2.5kg' },
      { name: 'sucre', price: 3.29, format: '2kg' },
      { name: 'huile végétale', price: 5.99, format: '1L' },
      { name: 'sauce tomate', price: 1.99, format: '680ml' },
      { name: 'céréales', price: 4.49, format: '500g' },
      { name: 'beurre d\'arachide', price: 4.99, format: '1kg' },
      
      // Boissons
      { name: 'jus de pomme', price: 2.99, format: '1.89L' },
      { name: 'jus d\'orange', price: 3.49, format: '1.75L' },
      { name: 'eau embouteillée', price: 2.49, format: '12x500ml' },
      { name: 'café moulu', price: 8.99, format: '925g' },
      { name: 'cola', price: 3.99, format: '2L' },
      
      // Produits ménagers
      { name: 'papier toilette 12 rouleaux', price: 7.49, format: '12 unités' },
      { name: 'essuie-tout', price: 8.99, format: '6 rouleaux' },
      { name: 'détergent à lessive', price: 8.99, format: '2.95L' },
      { name: 'savon à vaisselle', price: 2.79, format: '740ml' },
      { name: 'sacs poubelle', price: 5.99, format: '40 unités' },
      
      // Collations
      { name: 'chips', price: 2.99, format: '200g' },
      { name: 'biscuits', price: 2.49, format: '300g' },
    ]
  },
  'Metro': { 
    keywords: ['metro'],
    products: [
      { name: 'lait 2% 2l', price: 4.99, format: '2L' },
      { name: 'pain tranché multigrains', price: 2.79, format: '675g' },
      { name: 'oeufs gros calibre', price: 4.49, format: '12 unités' },
      { name: 'beurre salé', price: 5.99, format: '454g' },
      { name: 'yogourt grec', price: 4.49, format: '750g' },
      { name: 'poulet poitrine', price: 12.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.99, format: 'kg' },
      { name: 'saumon atlantique', price: 15.99, format: 'kg' },
      { name: 'pommes gala', price: 3.99, format: 'kg' },
      { name: 'bananes biologiques', price: 1.99, format: 'kg' },
      { name: 'laitue boston', price: 2.99, format: 'unité' },
      { name: 'tomates italiennes', price: 4.99, format: 'kg' },
      { name: 'fromage brie', price: 8.99, format: '300g' },
      { name: 'croissants', price: 4.99, format: '6 unités' },
      { name: 'vin rouge', price: 12.99, format: '750ml' },
        // Produits laitiers & oeufs
        { name: 'lait 3.25% 4l', price: 9.49, format: '4L' },
        { name: 'lait biologique 2l', price: 6.99, format: '2L' },
        { name: 'oeufs oméga-3', price: 5.99, format: '12 unités' },
        { name: 'beurre non salé', price: 6.49, format: '454g' },
        { name: 'yogourt nature biologique', price: 5.49, format: '650g' },
        { name: 'crème 35%', price: 3.99, format: '473ml' },
      
        // Boulangerie
        { name: 'pain artisan', price: 4.49, format: '500g' },
        { name: 'croissants', price: 4.99, format: '4 unités' },
        { name: 'baguette', price: 2.99, format: 'unité' },
      
        // Viandes & poissons
        { name: 'poulet de grain poitrine', price: 15.99, format: 'kg' },
        { name: 'poulet de grain cuisses', price: 9.99, format: 'kg' },
        { name: 'poulet biologique', price: 19.99, format: 'kg' },
        { name: 'boeuf striploin', price: 24.99, format: 'kg' },
        { name: 'porc côtelettes', price: 11.99, format: 'kg' },
        { name: 'saumon atlantique', price: 16.99, format: 'kg' },
        { name: 'crevettes', price: 19.99, format: 'kg' },
        { name: 'jambon forêt noire', price: 8.99, format: '500g' },
        { name: 'prosciutto', price: 12.99, format: '200g' },
      
        // Fruits
        { name: 'pommes biologiques', price: 5.49, format: 'kg' },
        { name: 'oranges sanguines', price: 3.99, format: 'kg' },
        { name: 'fraises du québec', price: 5.99, format: '454g' },
        { name: 'bleuets', price: 5.49, format: '454g' },
        { name: 'mangue', price: 2.99, format: 'unité' },
        { name: 'avocat', price: 1.99, format: 'unité' },
      
        // Légumes
        { name: 'asperges', price: 4.99, format: 'lb' },
        { name: 'brocoli', price: 2.99, format: 'unité' },
        { name: 'laitue romaine', price: 2.49, format: 'unité' },
        { name: 'salade mesclun', price: 4.99, format: '142g' },
        { name: 'tomates italiennes', price: 4.99, format: 'kg' },
        { name: 'concombres anglais', price: 1.99, format: 'unité' },
        { name: 'poivrons rouges', price: 4.99, format: 'lb' },
        { name: 'champignons portobello', price: 5.99, format: '227g' },
        { name: 'pommes de terre grelots', price: 4.99, format: '680g' },
        { name: 'courge butternut', price: 2.99, format: 'kg' },
      
        // Épicerie sèche
        { name: 'pâtes italiennes', price: 3.49, format: '500g' },
        { name: 'riz basmati', price: 6.99, format: '2kg' },
        { name: 'quinoa', price: 9.99, format: '1kg' },
        { name: 'huile d\'olive extra vierge', price: 12.99, format: '750ml' },
        { name: 'sauce tomate italienne', price: 3.99, format: '680ml' },
        { name: 'céréales granola', price: 5.99, format: '500g' },
      
        // Boissons
        { name: 'jus de canneberge', price: 4.49, format: '1.89L' },
        { name: 'café en grains', price: 12.99, format: '907g' },
        { name: 'thé vert', price: 5.49, format: '20 sachets' },
      
        // Produits ménagers
        { name: 'papier toilette écologique', price: 11.99, format: '12 unités' },
        { name: 'essuie-tout', price: 10.99, format: '6 rouleaux' },
        { name: 'détergent écologique', price: 11.99, format: '2L' },
        { name: 'savon à vaisselle bio', price: 4.49, format: '740ml' },
      
        // Collations & surgelés
        { name: 'craquelins', price: 3.99, format: '250g' },
        { name: 'chocolat noir', price: 4.99, format: '100g' },
        { name: 'crème glacée premium', price: 6.99, format: '1L' },
    ]
  }
}

/**
 * Generate realistic price data for Quebec stores
 * This replaces the non-functional Flipp API with a curated dataset
 */
export async function fetchFlippPrices({ stores = Object.keys(STORE_MAPPING), limit = 50 } = {}) {
  const allItems = []
  const stats = {}
  const today = new Date().toISOString().split('T')[0]

  for (const storeName of stores) {
    try {
      const storeConfig = STORE_MAPPING[storeName]
      if (!storeConfig) {
        stats[storeName] = { items: 0 }
        continue
      }

      // Get products for this store
      const products = storeConfig.products || []
      const limitedProducts = products.slice(0, limit)

      // Convert to our format
      const items = limitedProducts.map(product => ({
        name: product.name.toLowerCase(),
        store: storeName,
        price: product.price,
        format: product.format || null,
        updatedAt: today,
        _source: 'curated-qc-prices'
      }))

      allItems.push(...items)
      stats[storeName] = { items: items.length }

      console.log(`✓ ${storeName}: ${items.length} items`)

    } catch (error) {
      console.error(`Error processing ${storeName}:`, error)
      stats[storeName] = { items: 0, error: error.message }
    }
  }

  return {
    items: allItems,
    stats,
    errors: [],
    totalItems: allItems.length,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Edge function handler
 */
export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  // Basic authentication
  if (secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Optional test mode that returns a tiny static payload so you can verify the endpoint quickly
    if (searchParams.get('dry') === '1') {
      const sample = {
        items: [
          { name: 'lait 2% 2l', store: 'IGA', price: 3.99, format: '2L', updatedAt: new Date().toISOString().split('T')[0], _source: 'flipp-dry' },
          { name: 'bananes', store: 'Walmart', price: 0.79, format: 'lb', updatedAt: new Date().toISOString().split('T')[0], _source: 'flipp-dry' }
        ],
        stats: { IGA: { flyers: 1, items: 1 }, Walmart: { flyers: 1, items: 1 } },
        errors: [],
        totalItems: 2,
        generatedAt: new Date().toISOString(),
        debug: { mode: 'dry' }
      }
      return new Response(JSON.stringify(sample, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const storesParam = searchParams.get('stores')
    const stores = storesParam ? storesParam.split(',') : undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await fetchFlippPrices({ stores, limit })
    if (searchParams.get('debug') === '1') {
      result.debug = {
        requestUrl: request.url,
        stores,
        limit
      }
    }

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Flipp scraper error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
