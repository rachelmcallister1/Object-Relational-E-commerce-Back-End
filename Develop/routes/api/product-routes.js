const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model:Tag }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});
// get one product
router.get('/:id', (req, res) => {
  Product.findByPk((req.params.id),
    {
      include:[{model: Category}, {model: Tag}]
  
    },).then((data)=>{
      res.json(data)
    })
  });
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data


// create new product
router.post('/', async (req, res) => {
  try {
    const { product_name, price, stock, tagIds } = req.body;

    if (!product_name || !price) {
      res.status(400).json({
        error: 'product_name and price are required fields',
      });
      return;
    }

    const newProduct = await Product.create({
      product_name,
      price,
      stock: stock || 0,
    });

    if (tagIds && tagIds.length) {
      const productTagIdArr = tagIds.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });

      ProductTag.bulkCreate(productTagIdArr)
        .then((productTagIds) => res.status(200).json(newProduct))
        .catch((err) => {
          console.log(err);
          res.status(400).json(err);
        });
    } else {
      res.status(200).json(newProduct);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;