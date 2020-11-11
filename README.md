# Tutorial para Construção de API

Este tutorial é um complemento às videoaulas disponíveis em: https://www.youtube.com/playlist?list=PLd4Jo6d-yhDLJcFlLzx4SR4WU8hVUmuSQ

Nota: ao clonar este projeto você precisa criar manualmente o arquivo `.env`, conforme explica o tutorial a seguir.

Para saber mais: www.andresjesse.com

## Ambiente e Ferramentas:

- Node.js: https://nodejs.org/en/
- Express: https://expressjs.com/
- Postgres: https://www.postgresql.org/
- Sequelize: https://sequelize.org/
- Heroku: https://heroku.com/
- JWT: https://jwt.io/
- Permit: https://github.com/ianstormtaylor/permit

## Metodologia:

1. Configuração do Ambiente
2. Rotas e Controllers
3. Banco de Dados
4. Tratamento de Erros
5. Autenticação

## **1. Configuração do Ambiente**

Linux (Ubuntu):

`$ sudo snap install heroku --classic`

Mac:

`$ brew install heroku/brew/heroku `

Após a instalação, crie uma conta (heroku.com), e faça login:

`$ heroku login`

Crie um novo projeto **Node.js**. Você pode nomear e preencher os dados como quiser, eu batizei este exemplo como _Aula21-API-Heroku_:

```
$ mkdir Aula21-API-Heroku
$ cd Aula21-API-Heroku
$ yarn init
```

Adicione o framework **Express** e o middleware **CORS**:

`$ yarn add express cors`

Adicione o pacote **nodemon**, para monitorar as alterações durante o desenvolvimento. Esse passo é opcional, mas sem isso você precisa reiniciar o servidor toda vez que é feita uma modificação em qualquer arquivo:

`$ yarn add nodemon`

Adicione **scripts** de inicialização em `package.json`. Note que são criadas duas versões: "dev", que executa via nodemon (para usar durante o desenvolvimento); e "start", que executa o node diretamente (para usar em produção):

```
{
 "name": "Aula21-API-Heroku",
 "version": "1.0.0",
 "main": "index.js",
 "license": "MIT",
 "scripts": {
   "dev": "nodemon index.js",
   "start": "node index.js"
 },
 "dependencies": {
   "express": "^4.17.1"
 }
}
```

Crie o arquivo `index.js` com o seguinte conteúdo inicial:

```
const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
 res.send({ app: "hello pdm!" });
});

app.listen(PORT);
```

Execute o projeto (localhost):

`$ yarn dev`

Se tudo correu bem, você poderá acessar a rota inicial via: GET http://localhost:5000

Agora vamos enviar o projeto ao Heroku, inicialize um repositório **git** na pasta do projeto:

`$ git init .`

Crie o arquivo .gitignore ("ponto" gitignore!):

```
/node_modules
npm-debug.log
.DS_Store
/*.env
```

Faça o primeiro commit do projeto ao repositório git (local):

```
$ git add .
$ git commit -am 'initial commit'
```

Crie uma nova aplicação na plataforma Heroku (existe um máximo de 5 apps no plano grátis):

`$ heroku create`

Envie sua aplicação para execução:

`$ git push heroku master`

Se tudo correu bem, você poderá acessar a rota inicial via: GET https://SEU_APP.herokuapp.com/

## **2. Rotas e Controllers**

Considere que estamos criando uma API que gerencia o cadastro de carros. Vamos iniciar criando o controller `src/controllers/Cars.js` (as pastas _src_ e _controllers_ ainda não existem, crie-as). No arquivo recém criado, adicione o seguinte conteúdo inicial:

```
const Cars = {
  all(req, res) {
    return res.json(["Fusca", "Corcel", "Brasilia"]);
  },
};

module.exports = Cars;
```

Crie o arquivo de rotas `src/routes.js` e adicione o seguinte conteúdo inicial:

```
const express = require("express");
const router = express.Router();

const Cars = require("./controllers/Cars");

router.get("/cars", Cars.all);

module.exports = router;
```

Altere o arquivo `index.js` de modo a utilizar nosso arquivo de rotas ao invés da rota inicial (hello world):

```
const express = require("express");
const cors = require("cors");
const routes = require("./src/routes");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(PORT);
```

## **3. Banco de Dados**

Adicionar um banco **Postgres** ao projeto Heroku. Note que _:hobby-dev_ é o plano grátis, usado para fins didáticos deste tutorial:

`$ heroku addons:create heroku-postgresql:hobby-dev`

Adicionar as bibliotecas **pg** (Postgres) e **sequelize** (abstração de SQL) ao projeto:

`$ yarn add pg sequelize`

O banco de dados possui uma string de acesso (que deve ser secreta). Vamos adicionar a biblioteca **dotenv** para manter os dados seguros em variáveis de ambiente:

`$ yarn add dotenv`

Crie o arquivo `.env` ("ponto" env!), e adicione a variável de ambiente responsável pela conexão com o banco de dados do Heroku:

```
DATABASE_URL=postgres://**url do seu projeto**
```

A variável de ambiente `DATABASE_URL` é fornecida automaticamente no ambiente de produção (Heroku), mas não existe no ambiente local. Você pode obtê-la com o seguinte comando:

`$ heroku config:get DATABASE_URL`

Carregar a biblioteca dotenv no início do arquivo `index.js`:

`require("dotenv").config();`

Criar o arquivo de conexão `src/database/sequelize.js`:

```
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

//check connection (optional)
sequelize
  .authenticate()
  .then(() => console.log("Connection has been established successfully."))
  .catch((err) => console.error("Unable to connect to the database:", err));

module.exports = sequelize;
```

Criar o **model** para representar o tipo de dado "Carro": `src/database/models/Car.js`. Perceba que esse modelo define as colunasda tabela "car", e a função "init" encarrega-se da criação da tabela na primeira execução:

```
const { DataTypes } = require("sequelize");

const sequelize = require("../sequelize");

const Car = sequelize.define("car", {
  model: DataTypes.STRING,
  brand: DataTypes.STRING,
  hp: DataTypes.INTEGER,
});

//create table if not exists...
const init = async () => {
  await Car.sync();
};

init();

module.exports = Car;
```

Altere o **controller** responsável pelo tipo de dado "Carro": `src/controllers/Cars.js`. Este controller agora terá duas operações, mostrar todos os objetos (all) e criar um novo objeto (create). Ambas as operações fazemos acessos ao banco de dados e retornam um json em caso de sucesso. Eventuais erros são capturados (catch) e passados para o próximo middleware (trataremos disso a seguir):

```
const Car = require("../database/models/Car");

module.exports = {
  all(req, res, next) {
    Car.findAll()
      .then((result) => {
        res.json(result);
      })
      .catch(next);
  },

  create(req, res, next) {
    const { brand, model, hp } = req.body;

    Car.create({
      brand,
      model,
      hp,
    })
      .then((result) => {
        res.status(201).json(result); //return with ID -> 201 (CREATED)
      })
      .catch(next);
  },
};
```

A seguir, adicione as rotas do controller no arquivo `src/routes.js`:

```
const express = require("express");
const router = express.Router();

const CarsController = require("./controllers/CarsController");

router.get("/cars", CarsController.all);
router.post("/cars", CarsController.create);

module.exports = router;
```

Envie a nova versão para produção:

```
$ git add .
$ git commit -am 'initial database'
$ git push heroku master
```

Faça o teste: GET https://SEU_APP.herokuapp.com/cars

## **4. Tratamento de Erros**

Nas ações dos controllers (ex: `src/controllers/Cars.js`), vamos usar o parâmetro "next". É importante que todas as funções criadas nos controllers possam o next em sua assinatura: `(req, res, next)`. Também é interessante que os erros capturados sejam repassados ao próximo middleware `.catch(next)`. Ex:

```
create(req, res, next) {
  ...
  AlgumaOperacao()
    .then( ... )
    .catch(next);
},
```

Desta forma, os erros são repassados adiante, nos permitindo tratá-los de forma específica. Isso é útil pois permite que detalhes de implementação não sejam exibidos no ambiente de produção. No arquivo `index.js`, adicione uma função para tratamento de erros. Esta função tem como objetivo identificar o ambiente e fornecer uma mensagem genérica caso o processo esteja executando em produção.

```
...
app.use(routes);

//error handling
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "production")
    res.status(500).json({ error: "internal server error" });
  else return next(err);
});
```

Envie novamente o projeto ao Heroku:

```
$ git add .
$ git commit -am 'error handling'
$ git push heroku master
```

Para testar essa funcionalidade:

- No model "Car", comentar a linha `init()`, que cria a tabela na primeira execução. **Isso gerará um erro** caso o banco ainda não tenha sido criado;
- Entrar na dashboard do Heroku, resetar o banco de dados;
- Tentar criar um novo Car (PUSH na API):
  - Em localhost vemos o erro completo;
  - Na API remota vemos apenas "internal server error".
- Após os testes, descomente a linha init() para que a aplicação volte a funcionar.

## **5. Autenticação**

Até então nossa API está totalmente pública, qualquer pessoa tecnicamente é capaz de realizar operações e criar novos registros no banco de dados. Vamos exemplificar a restrição da API por meio de autenticação de usuários. Para isso, precisamos de três bibliotecas: **permit**, responsável pelo processo de autenticação; **bcrypt**, responsável pela criptografia da senha dos usuários; e **jsonwebtoken** (JWT), responsável pela criação, assinatura e verificação de tokens.

Instalação de dependencias:

`$ yarn add permit bcrypt jsonwebtoken`

Criar o modelo que representa os usuários do sistema, `src/models/User.js`. Note que ele é similar ao modelo "Car", porém foram incluídas (para fins de demonstração) restrições às colunas, impedindo a criação de usuários duplicados, nulos ou sem password:

```
const { DataTypes } = require("sequelize");

const sequelize = require("../sequelize");

const User = sequelize.define("user", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

//create table if not exists...
const init = async () => {
  await User.sync();
};

init();

module.exports = User;
```

Para saber mais sobre a definição de models: https://sequelize.org/master/manual/model-basics.html

Uma vez criado o model, podemos criar novos usuários no banco de dados. Aplicações mais complexas possuem formulários de cadastro, onde o próprio usuário cria sua conta. Neste exemplo, entretanto, deixaremos a criação de usuários por conta do administrador do sistema. Vamos introduzir o conceito de **seed**. Um script seed é criado para a inserção manual de dados no banco, podendo (por exemplo), servir como ferramenta de inicialização do sistema em um servidor recém instalado (literalmente, criando os dados iniciais).

Crie um arquivo de seed `src/database/seeds/seed.js` com o seguinte conteúdo inicial. Note que apenas um usuário é criado (você pode criar seeds como quiser, inclusive importando dados de outros sitemas, planilhas, etc.):

```
require("dotenv").config();

const bcrypt = require("bcrypt");

const User = require("../models/User");

User.create({
  username: "admin",
  password: bcrypt.hashSync("123", 10),
});

User.findAll().then((result) => {
  console.log(result);
});
```

**Importante:** perceba que o `password` do usuário não é armazenado! Mas sim uma versão criptografada com bcrypt.

Adicione o script **seed** ao arquivo `package.json`:

```
  ...
  "license": "MIT",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "seed": "node src/database/seeds/seed.js"
  },
  "dependencies": {
    ...
```

Isso nos permite executar o script via yarn e inserir um usuário no banco. Você pode executar o seed localmente ou via Heroku (tanto faz, ambos vão acessar o mesmo banco):

`$ yarn seed` (local)

ou

`$ heroku run yarn seed` (útil quando você precisa executar algo no host de produção)

Agora vamos criar um controller responsável pelo login e autenticação de usuários. Crie o arquivo `src/controllers/AuthController.js` com o seguinte conteúdo:

```
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Bearer } = require("permit");

const User = require("../database/models/User");

const permit = new Bearer();

module.exports = {
  login(req, res, next) {

  },

  auth(req, res, next) {

  },
};
```

A primeira ação, `login`, será responsável pela autenticação inicial do usuário, recebendo suas credenciais (username e password), e retornando um token válido. Implemente a função de login da seguinte forma:

```
  login(req, res, next) {
    const { username, password } = req.body;

    User.findOne({
      where: {
        username: username,
      },
    }).then((user) => {
      //username does not exists
      if (!user) return res.status(401).json({ error: "username not found" });

      //password check
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "invalid password" });
      }

      //generate & sign token
      let jwtPayload = { username: user.username }; //public payload!
      let token = jwt.sign(jwtPayload, process.env.JWT_SECRET); //user: user

      return res.status(200).json({ token });
    });
  },
```

Note que as credenciais vêm do corpo da requisiçã (req.body). O processo inicia-se buscando um usuário correspondente ao _username_ no banco de dados. Caso ele exista, o _password_ é comparado via bcrypt. Por fim, um token é gerado exclusivamente para este usuário (considere que o banco de dados pode conter muitos usuários).

**Importante**: apesar de o token ser codificado com uma chave de segurança `process.env.JWT_SECRET`, não é recomendado que se adicione dados sensíveis no payload (como a senha do usuário). Pense que este token é seguro, porém pode trafegar publicamente pela web.

A segunda ação, `auth`, é, na realidade, um middleware de autenticação. Todas as requisições que passarem por ela estarão sujeitas à verificação de token. Note que o token vem da requisição por meio da biblioteca permit, existem várias formas de se passar um token, aqui estamos usando o método Bearer. Caso token não exista, ou não seja válido (falha na verificação de assinatura), então o middleware interrompe a requisição retornando um código de erro 401. Caso contrário (token válido), a requisição é passada adiante carregando consigo o username do usuário autenticado.

```
  auth(req, res, next) {
    // Try to find the bearer token in the request.
    const token = permit.check(req);

    // No token found, so ask for authentication.
    if (!token) {
      permit.fail(res);
      return res.status(401).json({ error: "authentication required!" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        permit.fail(res);
        return res.status(401).json({ error: "failed to authenticate token!" });
      }

      //save username for next middleware
      req.username = decoded.username;
      next();
    });
  },
```

Note que, em ambas as ações fizemos uso de uma chave de segurança `process.env.JWT_SECRET`. Por questões de segurança, essa chave é deve ser armazenada como variável de ambiente (não sendo visível no código e nem sendo enviada ao git). No arquivo `.env`, crie uma chave de segurança (pode ser qualquer coisa, mas use algo difícil de adivinhar, de preferência uma hash):

```
DATABASE_URL=postgres://**url do seu projeto**
JWT_SECRET=**SUA_HASH_DIFICIL_DE_ADIVINHAR**
```

A configuração da chave de segurança no arquivo `.env` é suficiente para execução local, porém essa chave ainda não existe no servidor do Heroku (lembre-se, o `.env` não é enviado via git!). Vamos então criar uma variável de ambiente no Heroku:

`$ heroku config:set JWT_SECRET=**SUA_HASH_DIFICIL_DE_ADIVINHAR**`

Feito isso, nossa API já conta com um mecanismo de autenticação, precisamos apenas usá-lo. Volte ao arquivo de rotas, inclua uma rota para **login** e, na sequencia, use o middleware **auth** em todas as rotas que precisam de autenticação:

```
const express = require("express");
const router = express.Router();

const AuthController = require("./controllers/AuthController");
const CarsController = require("./controllers/CarsController");

router.post("/login", AuthController.login);

router.get("/cars", CarsController.all);
router.post("/cars", AuthController.auth, CarsController.create);

router.get("/secure", AuthController.auth, (req, res) => {
  res.json({ message: "this is a secure route!", username: req.username });
});

module.exports = router;
```

Perceba que, neste exemplo, o identificador único do usuário acompanha a requisição nas rotas autenticadas (`req.username`).

Envie novamente o projeto ao Heroku:

```
$ git add .
$ git commit -am 'error handling'
$ git push heroku master
```

Fim.
