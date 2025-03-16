import * as fs from 'fs';
import * as path from 'path';
import { 
  ensureDirectoryExists, 
  saveTextToFile, 
  saveTextItemsToFiles 
} from '../../src/utils/file-utils';

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock path.dirname
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  dirname: jest.fn().mockImplementation(path => path.split('/').slice(0, -1).join('/') || '/')
}));

describe('File Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('ensureDirectoryExists', () => {
    test('should create directory if it does not exist', () => {
      // Mock implementation for this test
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const dirPath = '/test/directory';
      const result = ensureDirectoryExists(dirPath);
      
      expect(fs.existsSync).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive: true });
      expect(result).toBe(dirPath);
    });

    test('should not create directory if it already exists', () => {
      // Mock implementation for this test
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      
      const dirPath = '/test/directory';
      const result = ensureDirectoryExists(dirPath);
      
      expect(fs.existsSync).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(result).toBe(dirPath);
    });
  });

  describe('saveTextToFile', () => {
    test('should save text content to a file and create directory if needed', () => {
      // Mock implementation for this test
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(path, 'dirname').mockReturnValue('/test/directory');
      
      const content = 'Test content';
      const filePath = '/test/directory/file.txt';
      
      const result = saveTextToFile(content, filePath);
      
      expect(path.dirname).toHaveBeenCalledWith(filePath);
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, content);
      expect(result).toBe(filePath);
    });
  });

  describe('saveTextItemsToFiles', () => {
    test('should save multiple text items to separate files', () => {
      // Mock implementation
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const directory = '/test/directory';
      const filenamePrefix = 'test_item';
      
      const result = saveTextItemsToFiles(items, directory, filenamePrefix);
      
      expect(fs.existsSync).toHaveBeenCalledWith(directory);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
      
      // Check that each item was saved with the correct filename
      items.forEach((item, index) => {
        const expectedFilePath = `${directory}/${filenamePrefix}_${index + 1}.txt`;
        expect(fs.writeFileSync).toHaveBeenCalledWith(expectedFilePath, item);
        expect(result[index]).toBe(expectedFilePath);
      });
      
      expect(result.length).toBe(3);
    });
  });
});
