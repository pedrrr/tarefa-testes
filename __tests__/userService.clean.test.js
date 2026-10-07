const { UserService } = require('../src/userService');

const IDADE_ADULTA = 25;
const IDADE_MENOR = 17;

const USUARIO_COMUM = {
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: IDADE_ADULTA,
};

const USUARIO_ADMIN = {
  nome: 'Admin',
  email: 'admin@teste.com',
  idade: IDADE_ADULTA,
  isAdmin: true,
};

describe('UserService', () => {
  let userService;

  const criarUsuario = ({ nome, email, idade, isAdmin }) =>
    userService.createUser(nome, email, idade, isAdmin);

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('retorna o usuário criado com id gerado e status ativo', () => {
      // Arrange
      const dados = USUARIO_COMUM;

      // Act
      const usuario = criarUsuario(dados);

      // Assert
      expect(usuario.id).toEqual(expect.any(String));
      expect(usuario).toMatchObject({
        nome: dados.nome,
        email: dados.email,
        idade: dados.idade,
        isAdmin: false,
        status: 'ativo',
      });
    });

    test('gera ids diferentes para usuários diferentes', () => {
      // Arrange
      const primeiro = criarUsuario(USUARIO_COMUM);

      // Act
      const segundo = criarUsuario(USUARIO_COMUM);

      // Assert
      expect(segundo.id).not.toBe(primeiro.id);
    });

    test('lança erro quando o usuário é menor de idade', () => {
      // Arrange
      const dadosMenor = { ...USUARIO_COMUM, idade: IDADE_MENOR };

      // Act
      const criarMenor = () => criarUsuario(dadosMenor);

      // Assert
      expect(criarMenor).toThrow('O usuário deve ser maior de idade.');
    });

    test.each(['nome', 'email', 'idade'])(
      'lança erro quando o campo obrigatório "%s" não é informado',
      (campoAusente) => {
        // Arrange
        const dadosIncompletos = { ...USUARIO_COMUM, [campoAusente]: undefined };

        // Act
        const criarIncompleto = () => criarUsuario(dadosIncompletos);

        // Assert
        expect(criarIncompleto).toThrow('Nome, email e idade são obrigatórios.');
      }
    );
  });

  describe('getUserById', () => {
    test('retorna o usuário previamente cadastrado', () => {
      // Arrange
      const criado = criarUsuario(USUARIO_COMUM);

      // Act
      const encontrado = userService.getUserById(criado.id);

      // Assert
      expect(encontrado).toEqual(criado);
    });

    test('retorna null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const encontrado = userService.getUserById(idInexistente);

      // Assert
      expect(encontrado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('desativa um usuário comum', () => {
      // Arrange
      const usuario = criarUsuario(USUARIO_COMUM);

      // Act
      const resultado = userService.deactivateUser(usuario.id);

      // Assert
      expect(resultado).toBe(true);
      expect(userService.getUserById(usuario.id).status).toBe('inativo');
    });

    test('não desativa um usuário administrador', () => {
      // Arrange
      const admin = criarUsuario(USUARIO_ADMIN);

      // Act
      const resultado = userService.deactivateUser(admin.id);

      // Assert
      expect(resultado).toBe(false);
      expect(userService.getUserById(admin.id).status).toBe('ativo');
    });

    test('retorna false quando o usuário não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('inclui o nome e o status de cada usuário cadastrado', () => {
      // Arrange
      const alice = criarUsuario({ ...USUARIO_COMUM, nome: 'Alice' });
      const bob = criarUsuario({ ...USUARIO_COMUM, nome: 'Bob' });
      userService.deactivateUser(bob.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(new RegExp(`${alice.id}.*Alice.*ativo`));
      expect(relatorio).toMatch(new RegExp(`${bob.id}.*Bob.*inativo`));
    });

    test('informa que não há usuários quando o cadastro está vazio', () => {
      // Arrange
      userService._clearDB();

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Nenhum usuário cadastrado');
    });
  });
});
