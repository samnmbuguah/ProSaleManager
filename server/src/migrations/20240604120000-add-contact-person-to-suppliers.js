export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("suppliers", "contact_person", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("suppliers", "contact_person");
  },
}; 