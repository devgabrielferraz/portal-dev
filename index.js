const express = require('express');
const mongoose = require('mongoose');
var bodyParser = require('body-parser')

const path = require('path');

const app = express();

const Posts = require('./posts.js');

mongoose.connect('CONECTE_AQUI_SEU_BANCO_DE_DADOS',{useNewUrlParser: true, useUnifiedTopology: true}).then(function(){
        console.log('Conectado com sucesso!');
}).catch(function(err){
    console.log(err.message);
})

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));

app.get('/', async (req, res) => {
    if (req.query.busca == null) {
        try {
            // Busca os posts mais recentes
            const posts = await Posts.find({}).sort({ '_id': -1 }).exec();
            const postsTop = await Posts.find({}).sort({ views: -1 }).limit(3).exec();

            // Mapeia os resultados
            const mappedPosts = posts.map((val) => ({
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 150),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
            }));

            const mappedPostsTop = postsTop.map((val) => ({
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
            }));

            // Renderiza a página
            res.render('home', { posts: mappedPosts, postsTop: mappedPostsTop });
        } catch (err) {
            console.error(err);
            res.status(500).send('Erro no servidor.');
        }
    } else {

        Posts.find({titulo: {$regex: req.query.busca,$options:"i"}},function(err,posts){
            //console.log(posts);

             // Mapeia os resultados
             posts = posts.map((val) => ({
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 400),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
            }));


            res.render('busca',{posts:posts,contagem:posts.length});
        });

    }
});

app.get('/:slug', async (req, res) => {
    try {
        // Incrementa as visualizações e obtém a notícia pelo slug
        const resposta = await Posts.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!resposta) {
            // Retorna 404 se a notícia não for encontrada
           // return res.status(404).send('Notícia não encontrada.');
           res.redirect('/');
        }
            
        // Carrega os posts em destaque (Top Posts)
        const postsTop = await Posts.find({}) // Você pode adicionar um filtro aqui
            .sort({ views: -1 })
            .limit(3);

        // Mapeia os posts para renderização
        const postsTopMapeados = postsTop.map((val) => ({
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 100),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
            views: val.views,
        }));

        // Renderiza a página single
        res.render('single', { noticia: resposta, postsTop: postsTopMapeados });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor.');
    }
});




app.listen(5000,()=>{
    console.log('server rodando!');
})